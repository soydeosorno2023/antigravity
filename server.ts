import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, setDoc, doc } from 'firebase/firestore';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import axios from 'axios';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Catch unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack trace:', reason.stack);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 8080;
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- PORT:', process.env.PORT);
  console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing');
  console.log('- FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'Set' : 'Missing');
  console.log('- APP_URL:', process.env.APP_URL || 'Not set (using default)');
  
  // Import the Firebase configuration
  let firebaseConfig: any;
  try {
    console.log('Reading firebase-applet-config.json');
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('Firebase config loaded from file');
    } else {
      console.warn('firebase-applet-config.json not found, using environment variables');
      firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        appId: process.env.FIREBASE_APP_ID,
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
      };
    }
  } catch (error) {
    console.error('Failed to read firebase-applet-config.json:', error);
    firebaseConfig = {};
  }

  // Initialize Firebase SDK on server
  let db: any;
  try {
    if (firebaseConfig && firebaseConfig.projectId) {
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log('Firebase Client SDK initialized');
    } else {
      console.error('CRITICAL: Firebase Project ID is missing. Client SDK not initialized.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Client SDK:', error);
  }

  app.get('/test', (req, res) => {
    res.send('Server is ALIVE and responding!');
  });

  app.use(cors({
    origin: process.env.APP_URL || '*',
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());
  
  // Set default axios headers
  axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  
  // Health check endpoint for Admin Dashboard
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      database: 'Firebase Firestore', 
      mysql_host: 'Cloud Firestore (NoSQL)' 
    });
  });

  // Export data endpoint
  app.get('/api/export', async (req, res) => {
    try {
      const collections = ['places', 'categories', 'communes', 'media', 'settings', 'tours'];
      const exportData: any = {};

      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        exportData[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.json`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Error al exportar datos: ' + error.message });
    }
  });

  // Security alert endpoint
  app.post('/api/send-security-alert', async (req, res) => {
    const { userId, operationType, path, errorMessage } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return res.status(500).json({ error: 'ADMIN_EMAIL not configured' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mail.soydeosorno.cl',
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Security Alert" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: '⚠️ Alerta de Seguridad: Acceso no autorizado',
        text: `Se ha detectado un intento de acceso no autorizado.\n\nUsuario: ${userId}\nOperación: ${operationType}\nRuta: ${path}\nError: ${errorMessage}\n\nRevisa los logs de seguridad en la base de datos.`,
      });

      res.json({ message: 'Alert sent' });
    } catch (error: any) {
      console.error('Security alert email error:', error);
      res.status(500).json({ error: 'Failed to send alert email' });
    }
  });

  // Import data endpoint
  const upload = multer({ dest: 'uploads/' });
  app.post('/api/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    try {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const data = JSON.parse(fileContent);
      
      res.json({ 
        message: 'Archivo recibido correctamente', 
        details: 'La importación masiva requiere privilegios de administrador en el servidor. Por favor, contacta al soporte técnico.' 
      });
    } catch (error: any) {
      console.error('Import error:', error);
      res.status(500).json({ error: 'Error al importar datos: ' + error.message });
    } finally {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  });

  // Helper to get the correct base URL for redirects
  const getBaseUrl = () => {
    return process.env.APP_URL || 'https://ais-dev-d5525pbwtewyjzdeirspwn-21198073983.us-west1.run.app';
  };

  // Initialize Firebase Admin SDK
  let adminDb: any;
  try {
    console.log('Initializing Firebase Admin SDK...');
    if (admin.apps.length === 0) {
      let serviceAccount: any = null;
      
      // Support for Service Account via Environment Variable (Ideal for Hostinger)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          console.log('Using service account from FIREBASE_SERVICE_ACCOUNT env var');
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
          console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', e);
        }
      }

      // Extract projectId from service account if missing from config
      if (!firebaseConfig.projectId && serviceAccount && serviceAccount.project_id) {
        console.log('Extracting projectId from service account:', serviceAccount.project_id);
        firebaseConfig.projectId = serviceAccount.project_id;
      }

      const adminConfig: any = {
        projectId: firebaseConfig.projectId
      };

      if (serviceAccount) {
        adminConfig.credential = admin.credential.cert(serviceAccount);
      } else {
        try {
          adminConfig.credential = admin.credential.applicationDefault();
          console.log('Using applicationDefault credentials');
        } catch (e) {
          console.warn('applicationDefault() not available, will try to initialize without explicit credentials');
        }
      }

      if (!adminConfig.projectId) {
        console.error('CRITICAL: No Project ID found for Firebase Admin SDK. Initialization might fail.');
      }

      admin.initializeApp(adminConfig);
      console.log('Firebase Admin SDK initialized successfully');
    }
    
    // Correct way to get a named database in Admin SDK
    const adminApp = admin.app();
    if (firebaseConfig.projectId) {
      adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
      console.log('AdminDb initialized successfully for project:', adminApp.options.projectId);
      console.log('Database ID:', firebaseConfig.firestoreDatabaseId);
    } else {
      console.error('AdminDb not initialized: projectId is still missing after extraction attempts');
    }

    app.post('/api/admin/create-owner', async (req, res) => {
      const email = req.body.email?.trim();
      const password = req.body.password;
      const username = req.body.username?.trim();
      const full_name = req.body.full_name?.trim();
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split('Bearer ')[1];

      try {
        // Verify admin token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Prioritize hardcoded admin check to bypass Firestore permission issues
        const isHardcodedAdmin = decodedToken.email === 'zonasur2011@gmail.com' && decodedToken.email_verified;
        
        let isAdminRole = false;
        if (!isHardcodedAdmin) {
          try {
            const adminUserDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
            isAdminRole = adminUserDoc.exists && adminUserDoc.data()?.role === 'admin';
          } catch (e: any) {
            console.error('[Admin] Firestore admin check failed:', e.message);
            // If it's not the hardcoded admin and firestore check fails, we can't verify admin status
            return res.status(403).json({ error: `Forbidden: Error checking admin permissions: ${e.message}` });
          }
        }

        if (!isAdminRole && !isHardcodedAdmin) {
          console.error(`Admin check failed for user ${decodedToken.uid}.`);
          return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        console.log(`[Admin] Admin access granted for: ${decodedToken.email}`);

        let uid: string;
        try {
          console.log(`Creating new owner user: ${email}`);
          // Try to create the user in Firebase Auth
          const userRecord = await admin.auth().createUser({
            email,
            password: password || undefined,
            displayName: full_name,
          });
          uid = userRecord.uid;
          console.log(`Created new user with UID: ${uid}`);
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-exists') {
            console.log(`User already exists in Auth: ${email}. Updating...`);
            // If user exists, update their details and get their UID
            const userRecord = await admin.auth().getUserByEmail(email);
            uid = userRecord.uid;
            console.log(`Found existing user UID: ${uid}`);
            
            const updateData: any = {
              displayName: full_name
            };
            if (password && password.trim() !== '') {
              console.log(`Updating password for user: ${uid}. Password length: ${password.trim().length}`);
              updateData.password = password.trim();
            }
            
            await admin.auth().updateUser(uid, updateData);
            console.log(`Updated Auth for user: ${uid}. Fields updated: ${Object.keys(updateData).join(', ')}`);
          } else {
            console.error('Error in Auth operation:', authError);
            throw authError;
          }
        }

        console.log(`Setting Firestore document for user ${uid} with role 'owner'`);
        const userDocRef = adminDb.collection('users').doc(uid);
        await userDocRef.set({
          email,
          username: username || email.split('@')[0],
          full_name: full_name || 'Owner',
          role: 'owner',
          updatedAt: new Date().toISOString(),
          uid: uid
        }, { merge: true });
        
        console.log(`Firestore document set successfully for ${uid}`);

        res.json({ uid });
      } catch (error: any) {
        console.error('Error creating/updating owner:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/api/admin/delete-user/:uid', async (req, res) => {
      const uidToDelete = req.params.uid;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }

      const token = authHeader.split('Bearer ')[1];

      try {
        console.log(`[Admin] Attempting to delete user ${uidToDelete}`);
        
        // 1. Verify admin token
        let decodedToken;
        try {
          decodedToken = await admin.auth().verifyIdToken(token);
          console.log(`[Admin] Token verified for: ${decodedToken.email}`);
        } catch (e: any) {
          console.error('[Admin] Token verification failed:', e.message);
          return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // 2. Check admin permissions
        const isHardcodedAdmin = decodedToken.email === 'zonasur2011@gmail.com' && decodedToken.email_verified;
        let isAdminRole = false;

        if (!isHardcodedAdmin) {
          try {
            const adminUserDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
            isAdminRole = adminUserDoc.exists && adminUserDoc.data()?.role === 'admin';
          } catch (e: any) {
            console.error('[Admin] Firestore admin check failed:', e.message);
            // If Firestore check fails but it's not the hardcoded admin, we can't verify admin status
            return res.status(403).json({ error: `Forbidden: Error checking admin permissions: ${e.message}` });
          }
        }

        if (!isAdminRole && !isHardcodedAdmin) {
          console.warn(`[Admin] User ${decodedToken.email} (UID: ${decodedToken.uid}) is not an admin.`);
          return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        console.log(`[Admin] Admin access granted for: ${decodedToken.email}`);

        // 3. Prevent self-deletion
        if (decodedToken.uid === uidToDelete) {
          return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
        }

        // 4. Delete from Firebase Auth
        try {
          await admin.auth().deleteUser(uidToDelete);
          console.log(`[Admin] Successfully deleted from Auth: ${uidToDelete}`);
        } catch (authError: any) {
          if (authError.code === 'auth/user-not-found') {
            console.log(`[Admin] User not found in Auth, continuing with Firestore...`);
          } else {
            console.error('[Admin] Auth deletion failed:', authError.message);
            throw authError;
          }
        }

        // 5. Delete from Firestore
        try {
          await adminDb.collection('users').doc(uidToDelete).delete();
          console.log(`[Admin] Successfully deleted from Firestore: ${uidToDelete}`);
        } catch (e: any) {
          console.error('[Admin] Firestore deletion failed:', e.message);
          throw new Error(`Error deleting from database: ${e.message}`);
        }

        res.json({ success: true });
      } catch (error: any) {
        console.error('[Admin] Final error in delete-user:', error);
        res.status(500).json({ 
          error: 'Error al eliminar usuario', 
          details: error.message || String(error) 
        });
      }
    });
  } catch (adminInitError) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK:', adminInitError);
    
    const errorHandler = (req: any, res: any) => {
      res.status(500).json({ 
        error: 'Firebase Admin SDK not initialized', 
        details: adminInitError instanceof Error ? adminInitError.message : String(adminInitError) 
      });
    };

    app.post('/api/admin/create-owner', errorHandler);
    app.delete('/api/admin/delete-user/:uid', errorHandler);
  }

  app.get('/api/geocode', async (req, res) => {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    const fetchGeocode = async () => {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
      return axios.get(url, {
        headers: {
          'User-Agent': 'MiraOsornoApp/1.0'
        },
        timeout: 15000
      });
    };

    try {
      const response = await fetchGeocode();
      return res.json(response.data);
    } catch (error: any) {
      console.error('Geocoding Proxy Error:', error.message);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message;
      res.status(status).json({ error: 'Error de conexión con el servicio de geocodificación: ' + message });
    }
  });

  app.get('/api/weather', async (req, res) => {
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const fetchWeather = async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      return axios.get(url, { timeout: 15000 });
    };

    try {
      const response = await fetchWeather();
      return res.json(response.data);
    } catch (error: any) {
      console.error('Weather Proxy Error:', error.message);
      
      if (error.response) {
        console.error('Weather Proxy Response Data:', error.response.data);
        console.error('Weather Proxy Response Status:', error.response.status);
      }
      
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || 'Unknown error';
      res.status(status).json({ error: `Error de conexión con el servicio de clima (${status}): ${message}` });
    }
  });

  app.get('/api/p-media', async (req, res) => {
    const userId = req.headers['x-ig-user-id'] || req.query.userId;
    const accessToken = req.headers['x-ig-access-token'] || req.query.accessToken;
    const limit = req.query.limit || 1;
    
    if (!userId || !accessToken) {
      console.warn('IG Proxy: Missing userId or accessToken', { 
        hasUserId: !!userId, 
        hasAccessToken: !!accessToken,
        headers: req.headers 
      });
      return res.status(400).json({ error: 'userId and accessToken are required' });
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(userId as string)}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=${limit}&access_token=${encodeURIComponent(accessToken as string)}`;
      const response = await axios.get(url, { timeout: 15000 });
      res.json(response.data);
    } catch (error: any) {
      console.error('IG Proxy Error:', error.message);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      res.status(status).json({ error: 'Error de conexión con Instagram: ' + message });
    }
  });

  app.get('/api/instagram/auth-url', (req, res) => {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/instagram/callback`;
    
    if (!clientId) {
      return res.status(500).json({ error: 'INSTAGRAM_CLIENT_ID not configured' });
    }

    const scopes = [
      'instagram_basic',
      'pages_show_list',
      'public_profile'
    ].join(',');

    const placeId = req.query.placeId as string;
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('oauth_state', JSON.stringify({ state, placeId }), { httpOnly: true, secure: true, sameSite: 'none' });

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${state}`;
    res.json({ url: authUrl });
  });

  app.get('/api/instagram/callback', async (req, res) => {
    const { code, state } = req.query;
    let storedData;
    try {
      storedData = JSON.parse(req.cookies?.oauth_state || '{}');
    } catch (e) {
      return res.status(400).send('Invalid state cookie');
    }
    const { state: storedState, placeId } = storedData;
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/instagram/callback`;

    if (!code || !state || state !== storedState) {
      return res.status(400).send('Invalid state or code');
    }

    try {
      console.log('Instagram callback received for placeId:', placeId);
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;
      const tokenResponse = await axios.get(tokenUrl);
      const tokenData = tokenResponse.data;
      console.log('Token data received');

      const fbAccessToken = tokenData.access_token;
      console.log('FB Access Token received');

      const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${fbAccessToken}`;
      const longLivedResponse = await axios.get(longLivedUrl);
      const longLivedData = longLivedResponse.data;
      const longLivedToken = longLivedData.access_token;
      console.log('Long-lived token received');

      const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account,name&access_token=${longLivedToken}`;
      const pagesResponse = await axios.get(pagesUrl);
      const pagesData = pagesResponse.data;
      console.log('Pages data received');

      let instagramBusinessAccountId = null;
      let instagramUsername = '';

      if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
          if (page.instagram_business_account) {
            instagramBusinessAccountId = page.instagram_business_account.id;
            
            const igUserUrl = `https://graph.facebook.com/v19.0/${instagramBusinessAccountId}?fields=username&access_token=${longLivedToken}`;
            const igUserResponse = await axios.get(igUserUrl);
            const igUserData = igUserResponse.data;
            instagramUsername = igUserData.username;
            break;
          }
        }
      }

      if (!instagramBusinessAccountId) {
        console.error('No se encontró cuenta de Instagram');
        return res.status(400).send('No se encontró cuenta de Instagram');
      }

      console.log('Sending Instagram data to client for placeId:', placeId);
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'INSTAGRAM_AUTH_SUCCESS',
                  placeId: '${placeId}',
                  data: {
                    instagram_access_token: '${longLivedToken}',
                    instagram_user_id: '${instagramBusinessAccountId}',
                    instagram_username: '${instagramUsername}',
                    instagram_token_expires_at: '${new Date(Date.now() + (longLivedData.expires_in * 1000)).toISOString()}'
                  }
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>¡Conexión Exitosa! Puedes cerrar esta ventana.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Instagram Graph OAuth error:', error);
      res.status(500).send(`Error de autenticación: ${error.message || error}`);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      console.log('Serving static files from:', distPath);
      app.use(express.static(distPath));
      app.get(/.*/, (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('index.html not found in dist folder. Please run npm run build.');
        }
      });
    } else {
      console.error('CRITICAL: dist folder not found. Static files will not be served.');
      app.get(/.*/, (req, res) => {
        res.status(500).send('dist folder not found. Please run npm run build and ensure it is uploaded.');
      });
    }
  }

  console.log('Attempting to listen on port:', PORT);
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message || err });
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
