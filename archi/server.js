// app.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
const SECRET = 'your_jwt_secret';

const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());

app.use((req,res,next) => {
    console.log("req");
    next();
})

let users = [];
let categories = [];
let products = [];
let userId = 1, categoryId = 1, productId = 1;

// Middleware d'authentification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
}

// SIGNIN
app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Utilisateur déjà existant' });
  users.push({ id: userId++, email, password });
  res.status(201).json({ message: 'OK' });
});

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
  res.status(200).json({ token });
});

// CRUD CATEGORIES
app.get('/categories', (req, res) => res.status(200).json(categories));
app.get('/categories/:id', (req, res) => {
  const category = categories.find(c => c.id === parseInt(req.params.id));
  if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });
  res.json(category);
});
app.post('/categories', authenticateToken, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const newCategory = { id: categoryId++, name };
  categories.push(newCategory);
  res.status(200).json(newCategory);
});
app.put('/categories/:id', authenticateToken, (req, res) => {
  const category = categories.find(c => c.id === parseInt(req.params.id));
  if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });
  category.name = req.body.name || category.name;
  res.status(201).json(category);
});
app.delete('/categories/:id', authenticateToken, (req, res) => {
  categories = categories.filter(c => c.id !== parseInt(req.params.id));
  res.status(201).json({ message: 'Supprimé' });
});

// CRUD PRODUITS
app.get('/produits', (req, res) => res.status(200).json(products));
app.get('/produits/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  res.status(200).json(product);
});
app.post('/produits', authenticateToken, (req, res) => {
  const { name, categoryId } = req.body;
  if (!name || !categoryId) return res.status(400).json({ error: 'Nom et catégorie requis' });
  if (!categories.find(c => c.id === categoryId)) return res.status(404).json({ error: 'Catégorie inexistante' });
  const newProduct = { id: productId++, name, categoryId };
  products.push(newProduct);
  res.status(201).json(newProduct);
});
app.put('/produits/:id', authenticateToken, (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  product.name = req.body.name || product.name;
  product.categoryId = req.body.categoryId || product.categoryId;
  res.status(201).json(product);
});
app.delete('/produits/:id', authenticateToken, (req, res) => {
  products = products.filter(p => p.id !== parseInt(req.params.id));
  res.status(200).json({ message: 'Supprimé' });
});

// RECHERCHE + PAGINATION
app.get('/produits/page/:page/{:term}', (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const term = req.params.term?.toLowerCase() || '';
  const perPage = 5;
  const filtered = products.filter(p => p.name.toLowerCase().includes(term));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  res.status(200).json({ page, total: filtered.length, produits: paginated });
});

// Produits par catégorie
app.get('/produits/categorie/:categorieId', (req, res) => {
  const categorieId = parseInt(req.params.categorieId);
  const produitsFiltres = products.filter(p => p.categoryId === categorieId);
  res.status(200).json(produitsFiltres);
});

app.listen(PORT, () => console.log(`API en ligne sur http://localhost:${PORT}`));
