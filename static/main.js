// Heap analytics setup
if (document.location.hostname.search("sahilgupta.github.io") !== -1) {
    setupHeapAnalytics("1031989618");
} else {
    setupHeapAnalytics("841248980");
}

// Initialization
setCountryCode();
setupPasteLogging();
showInstallPrompt();


function setupHeapAnalytics(appid) {
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

async function setCountryCode() {
    const ipInfoAPI = 'https://ipapi.co/json/';
    // Get the country code corresponding to user's country
    try {
        const response = await fetch(ipInfoAPI);
        const data = await response.json();
        window.countryCode = data.country;
        console.log('countryCode found: ' + data.country);
    } catch(error) {
        window.countryCode = "IN";
        console.error("Error fetching country code:", error);
    }
}

function setupPasteLogging() {
    document.getElementById('visiblePhoneNumber').addEventListener('paste', () => {
        heap.track('phoneNumber', { 'source': 'paste' });
    });
}

function showInstallPrompt() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const parser = new UAParser();
    const result = parser.getResult();
    if (isStandalone) {
        heap.addEventProperties('runningStandalone', true);
    } else {
        const addToHomeMessage = document.getElementById('addToHomeMessage');
        if (result.os.name === "Android") {
            setupAndroidInstallPrompt();
        } else if (result.os.name === "iOS") {
            setupIOSInstallPrompt(result.browser.name);
        } else {
            addToHomeMessage.innerHTML = "You can install this app on your phone";
        }
    }
}

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

function setupIOSInstallPrompt(browser) {
    if (browser === "Mobile Safari") {
        message = "To install this app on your iPhone, tap <img src='" + siteBaseURL + "/images/ios-share-icon.png' id='ios_share' class='align-top inline h-6'> and then 'Add to Home Screen'";
    } else {
        message = "To install this app on your iPhone, open this in Safari";
    }
    addToHomeMessage.innerHTML = message;
    addToHomeMessage.style.display = 'block';
}

