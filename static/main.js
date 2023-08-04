// Heap analytics setup
if (document.location.hostname.search("sahilgupta.github.io") !== -1) {
    setupHeap("1031989618");
} else {
    setupHeap("841248980");
}

function setupHeap(appid) {
    window.heap = window.heap || [];
    heap.load = function(e, t) {
        window.heap.appid = e, window.heap.config = t = t || {};
        var r = t.forceSSL || "https:" === document.location.protocol,
            a = document.createElement("script");
        a.type = "text/javascript", a.async = !0, a.src = (r ? "https:" : "http:") + "//cdn.heapanalytics.com/js/heap-" + e + ".js";
        var n = document.getElementsByTagName("script")[0];
        n.parentNode.insertBefore(a, n);
        for (var o = function(e) {
                return function() {
                    heap.push([e].concat(Array.prototype.slice.call(arguments, 0)))
                }
            }, p = ["addEventProperties", "addUserProperties", "clearEventProperties", "identify", "resetIdentity", "removeEventProperty", "setEventProperties", "track", "unsetEventProperty"], c = 0; c < p.length; c++) heap[p[c]] = o(p[c])
    };
    heap.load(appid);
}

// Get the country code corresponding to user's country
var ipInfoAPI = 'https://ipapi.co/json/';
var countryCode = "IN";
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var response = JSON.parse(this.responseText);
        console.log('countryCode found: ' + response.country);
        countryCode = response.country;
    }
};
xhr.open('GET', ipInfoAPI, true);
xhr.send();

function validateNumber(inputNumber) {
    var parsedNumber = libphonenumber.parsePhoneNumberFromString(inputNumber, countryCode)
    if (parsedNumber && parsedNumber.isValid() === true) {
        return parsedNumber;
    } else {
        return null;
    }
}

function prettifyVisibleNumber(parsedNumber) {
    document.getElementById("visiblePhoneNumber").value = parsedNumber.formatInternational();
}

function submitHiddenForm(parsedNumber) {
    var phone = parsedNumber.number.substring(1); // Remove the "+" from the E.164 formatted number
    document.getElementById("hiddenPhoneNumber").value = phone;
    document.forms.hiddenForm.submit();
}

function startChat(event) {
    event.preventDefault();
    var inputNumber = document.getElementById("visiblePhoneNumber").value;
    var parsedNumber = validateNumber(inputNumber);
    if (parsedNumber) {
        prettifyVisibleNumber(parsedNumber);
        submitHiddenForm(parsedNumber);
    }
}

var parser = new UAParser();
var result = parser.getResult();
var message;

function isRunningStandalone() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone == true) {
        return true;
    }
    return false;
}

if (isRunningStandalone()) {
    heap.addEventProperties('runningStandalone', true);
} else {
    const addToHomeMessage = document.getElementById('addToHomeMessage')
    if (result.os.name === "Android") {
        setupAndroidInstallPrompt();
    } else if (result.os.name === "iOS") {
        setupIOSInstallPrompt();
    } else {
        message = "You can install this app on your phone";
        document.getElementById('addToHomeMessage').innerHTML = message;
    }
}

function setupAndroidInstallPrompt() {
    let deferredPrompt;
    message = '<button type="button" id="addToHome" class="btn btn-outline-info">Install this App</button>';
    window.addEventListener('beforeinstallprompt', (e) => {
        heap.track('addToHome', {
            'status': 'prompt triggered'
        });
        e.preventDefault();
        deferredPrompt = e;
        addToHomeMessage.innerHTML = message;
        addToHomeMessage.style.display = 'block';
        addToHomeMessage.addEventListener('click', (e) => {
            addToHomeMessage.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    heap.track('addToHome', {
                        'status': 'prompt accepted'
                    });
                    console.log('User accepted the A2HS prompt');
                } else {
                    heap.track('addToHome', {
                        'status': 'prompt ignored'
                    });
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null;
            });
        });
    });
}

function setupIOSInstallPrompt() {
    if (result.browser.name === "Mobile Safari") {
        message = "To install this app on your iPhone, tap <img src='{{ site.baseurl }}/images/ios-share-icon.png' id='ios_share'> and then 'Add to Home Screen'";
    } else {
        message = "To install this app on your iPhone, open this in Safari";
    }
    addToHomeMessage.innerHTML = message;
    addToHomeMessage.style.display = 'block';
}

function logPaste(event) {
    heap.track('phoneNumber', {
        'source': 'paste'
    });
}
document.getElementById('visiblePhoneNumber').onpaste = logPaste;
