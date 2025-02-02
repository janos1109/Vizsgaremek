let cart = [];
let sum = 0;

betoltes();

function betoltes() {
    const cartElem = document.getElementById('cart');
    const sumElem = document.getElementById('osszesen');

    cart = JSON.parse(sessionStorage.cartItems);
    sum = 0;
    cart.forEach(c => {
        cartElem.innerHTML +=
            '<div class="py-2 border-top border-secondary text-center">' +
            '<div class="my-auto text-warning">' + c.name + '</div>' +
            '<div class="my-auto">' + c.quantity + ' x ' + c.price + ' Ft</div>' +
            '<div class="my-auto text-info">' + (c.quantity * c.price) + ' Ft</div>' +
            '</div>';
        sum += c.quantity * c.price;
        sumElem.innerHTML = '<h6 class="text-info p-3">Fizetendő: ' + sum + ' Ft</h6>';
    });
};

const form = document.getElementById('form');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    let name = document.getElementById('name').value;
    let email = document.getElementById('email').value;
    let mobile = document.getElementById('mobile').value;
    let address = document.getElementById('address').value;
    let city = document.getElementById('city').value;
    let postcode = document.getElementById('postcode').value;
    let country = document.getElementById('country').value;
    let message = document.getElementById('message').value;

    sendOrder(name, email, mobile, address, city, postcode, country, message);
})

document.getElementById('btnCancel').onclick = function (e) {
    e.preventDefault();
    showMessageCancelAndQuit();
}

function sendOrder(name, email, mobile, address, city, postcode, country, message) {
    const url = 'http://localhost:3000/order';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            "name": name,
            "address": address,
            "city": city,
            "postcode": postcode,
            "country": country,
            "mobile": mobile,
            "email": email,
            "createdAt": getCurrentDateTime(),
            "total": sum,
            "messageFromUser": message
        })
    })
        .then((response) => response.json())
        .then(json => sessionStorage.orderId = json.insertId)
        .then(() => cart.forEach(c => saveOrderItemsToDB(sessionStorage.orderId, c)))
        .then(() => sessionStorage.removeItem('cartItems'))
        .then(() => showMessageSuccessAndQuit())
        .catch(err => console.log(err));
}

function saveOrderItemsToDB(orderId, c) {
    const url = 'http://localhost:3000/orderitems';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            "orderId": orderId,
            "orderItems": c
        })
    })
        .then((response) => response.json())
        .then(json => console.log(json))
        .catch(err => console.log(err));
}

function getCurrentDateTime() {
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date + ' ' + time;
    return dateTime;
}

function showMessageSuccessAndQuit() {
    swal({
        title: 'Sikeres rendelés!',
        text: 'Siker',
        icon: 'success',
        button: 'Ok'
    })
        .then(() => window.open('order.html', '_self'));
}

function showMessageCancelAndQuit() {
    swal({
        title: 'Biztosan kilépsz?',
        icon: 'warning',
        buttons: ['Nem', 'Igen'],
    })
        .then((willCancel) => {
            if (willCancel) {
                swal({
                    title: 'Szeretnéd törölni a kosarad tartalmát is?',
                    icon: 'warning',
                    buttons: ['Nem', 'Igen'],
                })
                    .then((willDelete) => {
                        if (willDelete) {
                            sessionStorage.removeItem('cartItems');
                        }
                    })
                    .then(() => window.open('order.html', '_self'))
            }
        });
}