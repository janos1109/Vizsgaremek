const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();
const cors = require('cors');
app.use(cors());
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const pool = mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});
const port = 3000;

// Menü lehívása
app.get('/menu', (req, res) => {
    const q = "SELECT * FROM menu_item";
    pool.query(q, (error, results) => {
        if (!error) res.send(results);
        else res.send(error);
    });
});

// Egy menüelem lekérdezése
app.get('/menuitems/:id', (req, res) => {
    const q = "SELECT * FROM menu_item WHERE id = ?";
    pool.query(q, [req.params.id],
        (error, result) => {
            if (!error) res.send(result);
            else res.send(error);
        });
});

// Rendelés rögzítése
app.post('/order', (req, res) => {
    const q = 'INSERT INTO orders (name, address, city, postcode, country, ' +
        'mobile, email, createdAt, total, messageFromUser, visszavont)' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
    pool.query(q,
        [req.body.name,
        req.body.address,
        req.body.city,
        req.body.postcode,
        req.body.country,
        req.body.mobile,
        req.body.email,
        req.body.createdAt,
        req.body.total,
        req.body.messageFromUser,
            false],
        (error, result) => {
            if (!error) res.send(result);
            else res.send(error);
        });

});

// Rendelés tételeinek rögzítése
app.post('/orderitems', (req, res) => {
    const q = 'INSERT INTO order_item (orderId, itemId, quantity) ' +
        'VALUES (?, ?, ?);'
    pool.query(q,
        [req.body.orderId,
        req.body.orderItems.id,
        req.body.orderItems.quantity],
        (error, result) => {
            if (!error) res.send(result);
            else res.send(error);
        });
});

// Bejelentkezés
app.post('/admin/login', (req, res) => {
    const admin = process.env.ADMIN;
    const hash = process.env.HASH;
    if (req.body.username != admin)
        return res.status(401).send({ message: "Hibás felhasználónév!" });
    if (!bcrypt.compareSync(req.body.password, hash))
        return res.status(401).send({ message: 'Hibás jelszó!' });
    const token = jwt.sign(
        { password: req.body.password },
        process.env.TOKEN_SECRET,
        { expiresIn: 3600 });
    res.json({ token: token, message: 'Sikeres bejelentkezés!' });
})

// Token ellenőrzése
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).send({ message: 'Azonosítás szükséges!' });
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err)
            return res.status(403).send({ message: 'Nincs jogosultsága!' });
        req.user = user;
        next();
    })
}

// Rendelések lekérése
app.get('/admin/order', authenticateToken, (req, res) => {
    const q = "SELECT * FROM orders WHERE visszavont = false ORDER BY createdAt DESC;";
    pool.query(q, (error, results) => {
        if (!error) res.send(results);
        else res.send(error);
    });
});

// Egy rendelés tételeinek lekérése
app.get('/admin/order/:id', authenticateToken, (req, res) => {
    const q = "SELECT menu_item.name AS name, menu_item.price AS price, " +
        "order_item.quantity AS quantity FROM order_item " +
        "JOIN menu_item ON menu_item.id = order_item.itemId " +
        "WHERE orderId = ?;";
    pool.query(q, [req.params.id],
        (error, results) => {
            if (!error) res.send(results);
            else res.send(error);
        });
});

// Rendelés törlése (visszavonás igazra állítása)
app.patch('/admin/order/:id', authenticateToken, (req, res) => {
    const q = "UPDATE orders SET visszavont = true " +
        "WHERE id = ?;";
    pool.query(q, [req.params.id],
        (error, result) => {
            if (!error) res.send(result);
            else res.send(error);
        });
});

// Új elem hozzáadása az étlaphoz
app.post('/admin/menu', authenticateToken, (req, res) => {
    const q = "INSERT INTO menu_item (name, price, imgPath, course)" +
        "VALUES (?, ?, ?, ?);";
    pool.query(q,
        [req.body.name,
        req.body.price,
        req.body.imgPath,
        req.body.course],
        (error, result) => {
            if (!error) res.send(result);
            else res.send(error);
        });

});

// Elem módosítása az étlapon
app.put('/admin/menu/:id', authenticateToken, (req, res) => {
    const q = "UPDATE menu_item " +
        "SET name = ?, price = ?, imgPath = ?, course = ? " +
        "WHERE id = ?;";
    pool.query(q,
        [req.body.name,
        req.body.price,
        req.body.imgPath,
        req.body.course,
        req.params.id],
        (error, result) => {
            if (!error) res.send(result);
            else res.send(error);
        });

});

// Elem törlése az étlapról
app.delete('/admin/menu/:id', authenticateToken, (req, res) => {
    const q = "DELETE FROM menu_item WHERE id = ?;";
    pool.query(q, [req.params.id],
        (error, result) => {
            if (!error) res.send(result);
            else res.send(error);
        })
})

app.listen(port, () => {
    console.log(`Szerver elindítva a ${port}-es porton...`);
});