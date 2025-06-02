var email;
var mdp;
var signin = document.querySelector('#signin');
var token;

const signBtn = document.getElementById('sign');
const signinForm = document.getElementById('signin');

if (signBtn && signinForm) {
    signBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        signinForm.classList.toggle('hidden');
    });

    document.addEventListener('click', function(event) {
        if (!signinForm.contains(event.target) && event.target !== signBtn) {
            signinForm.classList.add('hidden');
        }
    });

    signin.addEventListener('submit', async (event) => {
        event.preventDefault();
        email = document.querySelector('#email').value;
        mdp = document.querySelector('#mdp').value;
        var loginJson = {
            "email": email,
            "password": mdp
        };
        var apiUrl = 'http://localhost:3000/signin';
        try {
            var response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginJson)
            });
        } catch (error) {
            console.error('Error:', error);
        }

        apiUrl = 'http://localhost:3000/login';
        try {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginJson)
            });
        } catch (error) {
            console.error('Error:', error);
        }

        var data = await response.json();
        token = data.token;
        localStorage.setItem('token', token);
        console.log(data.token);

        await deleteCategories(token);
        await postCategories(token);

        window.location.href = 'product.html';
    });
}

async function postCategories(token) {
    var liste = ["Fruit", "Légume", "Viande", "Poisson", "Boisson"];
    var apiUrl = 'http://localhost:3000/categories';
    for (let i = 0; i < liste.length; i++) {
        var category = {
            "name": liste[i]
        };
        try {
            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(category)
            });
        } catch (error) {
            console.error('Error while creating categories:', error);
        }
    }
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    var data = await response.json();
    console.log(data);
    return data;
}

async function getCategories(token) {
    var apiUrl = 'http://localhost:3000/categories';
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories :', error);
        return [];
    }
}

async function deleteCategories(token) {
    var apiUrl = `http://localhost:3000/categories`;
    let data = [];
    data = await getCategories(token);
    for (let i = 0; i < data.length; i++) {
        try {
            await fetch(`${apiUrl}/${data[i].id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`Catégorie ${data[i].id} supprimée`);
        } catch (error) {
            console.error('Error while deleting:', error);
        }
    }
}

async function postProduits(token) {
    var liste = ["orange", "brocoli", "steak", "saumon", "eau"];
    var apiUrl = 'http://localhost:3000/produits';
    const categories = await getCategories(token);
    for (let i = 0; i < liste.length; i++) {
        var produit = {
            "name": liste[i],
            "categoryId": categories[i] ? categories[i].id : null
        };
        try {
            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(produit)
            });
        } catch (error) {
            console.error('Error while creating product:', error);
        }
    }
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    var data = await response.json();
    console.log(data);
    return data;
}

async function displayCategories(token, containerId = 'productList') {
    const append = document.querySelector(`#${containerId}`);
    if (!append) return;
    append.innerHTML = "";
    const liste = await getCategories(token);
    for (const categorie of liste) {
        const div = document.createElement("div");
        div.id = categorie.id;
        div.textContent = categorie.name;
        div.style.cursor = "pointer";
        div.addEventListener('click', async () => {
            await showProductsOverlay(token, categorie);
        });
        append.appendChild(div);
    }
}

async function getProduitsByCategory(token, categoryId) {
    const apiUrl = `http://localhost:3000/produits/categorie/${categoryId}`;
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des produits :', error);
        return [];
    }
}

async function showProductsOverlay(token, categorie) {
    const overlay = document.getElementById('productOverlay');
    const content = document.getElementById('productOverlayContent');
    content.innerHTML = `<button id="closeOverlay" title="Fermer">&times;</button>
        <h2>Produits de ${categorie.name}</h2>
        <div id="productsList"></div>`;
    overlay.classList.remove('hidden');

    document.getElementById('closeOverlay').onclick = () => overlay.classList.add('hidden');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.add('hidden'); };

    const produits = await getProduitsByCategory(token, categorie.id);
    const listDiv = document.getElementById('productsList');
    if (produits.length === 0) {
        listDiv.textContent = "Aucun produit pour cette catégorie.";
    } else {
        produits.forEach(prod => {
            const p = document.createElement('div');
            p.textContent = prod.name;
            listDiv.appendChild(p);
        });
    }
}

// Initialisation sur product.html
if (window.location.pathname.endsWith('product.html')) {
    const token = localStorage.getItem('token');
    if (token) {
        displayCategories(token);
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', function() {
            const value = this.value.trim().toLowerCase();
            document.querySelectorAll('#productList > div').forEach(div => {
                if (value && div.textContent.toLowerCase().includes(value)) {
                    div.classList.add('highlight');
                } else {
                    div.classList.remove('highlight');
                }
            });
        });
    }
}