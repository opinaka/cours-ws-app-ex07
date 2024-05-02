const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const uuid = require('uuid');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./webhooks-swagger.json'); // Chemin vers votre fichier JSON

// Middleware pour parser le corps des requêtes en JSON
app.use(bodyParser.json());

// Servez la documentation Swagger UI à partir du fichier JSON
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Personnalisation du rendu de Swagger UI
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar {
      background-image: url('https://raw.githubusercontent.com/opinaka/cours-ws-app-ex06/main/.png');
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center;
      height: 50px; /* Ajustez la hauteur en fonction de votre logo */
    }

    .swagger-ui .topbar .link {
      display: none; /* Masquer le logo Swagger par défaut */
    }
  `,
  customSiteTitle: "Opinaka",
  customfavIcon: "https://raw.githubusercontent.com/opinaka/cours-ws-app-ex06/main/ynov.png"
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Liste des webhooks avec les URLs des API des clients
const webhooks = new Map();

// Route pour enregistrer un nouveau webhook avec l'URL de l'API du client
app.post('/webhooks', (req, res) => {
  // Récupérer l'URL de l'API du client depuis le corps de la requête
  const clientApiUrl = req.body.clientApiUrl;

  // Vérifier si l'URL existe déjà dans la liste des webhooks
  if ([...webhooks.values()].includes(clientApiUrl)) {
    // Si l'URL existe déjà, renvoyer une erreur
    return res.status(400).json({ error: 'URL de webhook déjà existante' });
  }

  // Générer un ID unique pour le webhook
  const webhookId = uuid.v4();

  // Ajouter le lien webhook avec l'URL de l'API du client à la liste
  webhooks.set(webhookId, clientApiUrl);

  // Répondre avec l'ID du webhook
  res.json({ webhookId });
});

/**
curl --request POST \
  --url http://localhost:3000/webhooks \
  --header 'Content-Type: application/json' \
  --data '{"clientApiUrl": "www.opinaka.com"}'
*/
// Route pour désinscrire un webhook de la liste
app.delete('/webhooks/:webhookId', (req, res) => {
  // Récupérer l'ID du webhook depuis les paramètres de la requête
  const webhookId = req.params.webhookId;

  // Supprimer le webhook de la liste
  const deleted = webhooks.delete(webhookId);

  if (deleted) {
    res.json({ message: 'Webhook désinscrit avec succès' });
  } else {
    res.status(404).json({ error: 'Webhook non trouvé' });
  }
});
/**
curl --request DELETE \
  --url http://localhost:3000/webhooks/914ac5a0-c5bb-4a46-8979-d2729cfb47b0
*/
  
// Route pour obtenir la liste des URLs des webhooks
app.get('/webhooks', (req, res) => {
  // Convertir la carte des webhooks en tableau d'objets
  const webhookList = Array.from(webhooks).map(([webhookId, clientApiUrl]) => {
    return { webhookId, clientApiUrl };
  });

  // Répondre avec la liste des URLs des webhooks
  res.json(webhookList);
});
/**
curl --request GET \
  --url http://localhost:3000/webhooks \
  --header 'User-Agent: insomnia/2023.5.8'
*/
// Fonction pour générer et envoyer des valeurs aléatoires aux webhooks
function genererEtEnvoyerValeurs() {
  // Générer une valeur aléatoire
  const valeur = Math.random();

  // Envoyer la valeur à tous les webhooks
  for (const [webhookId, clientApiUrl] of webhooks) {
    axios.post(clientApiUrl, { valeur })
      .then(() => {
        console.log(`Envoyé la valeur ${valeur} au webhook ${webhookId}`);
      })
      .catch((error) => {
        console.error(`Erreur lors de l'envoi de la valeur au webhook ${webhookId}:`, error.message);
      });
  }
}

// Planifier l'exécution de la fonction toutes les 2 secondes
setInterval(genererEtEnvoyerValeurs, 2000);

// Démarrer le serveur sur le port de votre choix
app.listen(3000, () => {
  console.log('Serveur écoutant sur le port 3000');
});
