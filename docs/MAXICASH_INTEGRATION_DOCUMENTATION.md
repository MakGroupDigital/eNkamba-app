# Documentation d'integration MaxiCash

Ce document regroupe les informations d'integration MaxiCash pour les environnements Sandbox et Live. Il couvre les integrations Website via MaxiCash Gateway, les integrations Mobile App ou web avancees via MaxiCash API, les endpoints, les parametres, les flux de paiement et les exemples de requetes.

## 1. Vue d'ensemble

MaxiCash propose deux modeles principaux d'integration :

- **MaxiCash Gateway** : integration conseillee pour les sites web. Elle permet aux marchands de recevoir des paiements via MaxiCash, cartes bancaires, PayPal, Pepele Mobile, Mobile Money, Mobile Banking et autres canaux disponibles.
- **MaxiCash API** : integration conseillee pour les applications mobiles et les sites web complexes. Elle permet uniquement les paiements effectues par des utilisateurs MaxiCash.

## 2. Endpoints

### 2.1 API MaxiCash

| Environnement | Endpoint |
| --- | --- |
| Sandbox | `https://api-testbed.maxicashapp.com/Merchant/api.asmx` |
| Live | `https://api.maxicashapp.com/Merchant/api.asmx` |

### 2.2 Gateway MaxiCash

| Environnement | Endpoint |
| --- | --- |
| Sandbox | `https://api-testbed.maxicashapp.com/payentry` |
| Live | `https://api.maxicashapp.com/payentry` |

### 2.3 Form Post Payment

| Environnement | Endpoint |
| --- | --- |
| Sandbox | `https://api-testbed.maxicashapp.com/PayEntryPost` |
| Live | `https://api.maxicashapp.com/PayEntryPost` |

### 2.4 QueryString URL Payment

| Environnement | Endpoint |
| --- | --- |
| Sandbox | `https://api-testbed.maxicashapp.com/PayEntry` |
| Live | `https://api.maxicashapp.com/PayEntry` |

### 2.5 Pay Entry Web

Etape 1 : creation de session.

| Environnement | Endpoint |
| --- | --- |
| Sandbox | `https://webapi-test.maxicashapp.com/Integration/PayEntryWeb` |
| Live | `https://webapi.maxicashapp.com/Integration/PayEntryWeb` |

Etape 2 : redirection gateway avec `LogID`.

| Environnement | Endpoint |
| --- | --- |
| Sandbox | `https://api-testbed.maxicashapp.com/payentryweb?logid={LogID}` |
| Live | `https://api.maxicashapp.com/payentryweb?logid={LogID}` |

### 2.6 Donation NGO

| Environnement | Endpoint |
| --- | --- |
| Sandbox | `https://api-testbed.maxicashapp.com/donationentry` |
| Live | `https://api.maxicashapp.com/donationentry` |

## 3. Regles importantes

- Les montants doivent generalement etre envoyes en **cents**. Exemple : `1 USD` doit etre envoye comme `100`.
- Pour les methodes API MaxiCash, les devises courantes sont `maxiDollar` et `maxiRand`.
- Pour le gateway, les valeurs mentionnees sont `USD`, `ZAR`, `maxiRand` et `maxiDollar`.
- Les langues supportees sont `en` et `fr`.
- Les credentials `MerchantID` et `MerchantPassword` doivent rester cote serveur quand l'integration le permet. Eviter de les exposer dans du code frontend public.
- Le parametre `Reference` doit etre unique cote marchand pour faciliter la reconciliation.
- `notifyurl` est optionnel dans certains flux, mais fortement recommande pour confirmer le statut cote serveur avant de finaliser une commande.

## 4. MaxiCash Gateway

La Gateway permet de collecter des paiements sur un compte MaxiCash marchand via plusieurs moyens de paiement. Elle est adaptee aux sites web, aux formulaires de paiement, aux boutons de donation et aux plugins e-commerce.

Modes d'integration disponibles :

- Form Post
- URL avec QueryString
- Pay Entry Web REST
- Donate Button pour ONG
- Plugins e-commerce WordPress/WooCommerce et Prestashop 1.6/1.7

## 5. Form Post Payment

Le paiement Form Post consiste a poster un formulaire HTML vers `PayEntryPost`.

### 5.1 Parametres

| Parametre | Obligatoire | Description |
| --- | --- | --- |
| `PayType` | Oui | Toujours `MaxiCash`, sauf specification contraire. |
| `Amount` | Oui | Montant en cents. Exemple : `100` pour `1 USD`. |
| `Currency` | Oui | Devise de la transaction : `USD`, `ZAR`, `maxiRand`, `maxiDollar`. |
| `Telephone` | Non | Numero du payeur. Souvent utilise pour Mobile Money. |
| `Email` | Non | Email du payeur. Souvent utilise pour carte bancaire. |
| `MerchantID` | Oui | Identifiant marchand MaxiCash. |
| `MerchantPassword` | Oui | Mot de passe marchand MaxiCash. |
| `Language` | Non | `en` ou `fr`. Par defaut : anglais. |
| `Reference` | Oui | Reference transactionnelle du marchand. |
| `accepturl` | Oui | URL de redirection apres paiement reussi. |
| `cancelurl` | Non | URL de redirection si le payeur annule. Si absent, MaxiCash utilise `declineurl`. |
| `declineurl` | Oui | URL de redirection apres paiement echoue. |
| `notifyurl` | Non | URL appelee par MaxiCash pour notifier le statut avant redirection. Recommande. |

### 5.2 Exemple HTML

```html
<form action="https://api.maxicashapp.com/PayEntryPost" method="POST">
  <input type="hidden" name="PayType" value="MaxiCash">
  <input type="hidden" name="Amount" value="{TOTAL_AMOUNT}">
  <input type="hidden" name="Currency" value="MaxiDollar">
  <input type="hidden" name="Telephone" value="{MAXICASH_TELEPHONE_NO}">
  <input type="hidden" name="Email" value="{MAXICASH_EMAIL}">

  <input type="hidden" name="MerchantID" value="{YOUR_MERCHANT_ID}">
  <input type="hidden" name="MerchantPassword" value="{YOUR_MERCHANT_PASSWORD}">
  <input type="hidden" name="Language" value="En">
  <input type="hidden" name="Reference" value="{REFERENCE_OF_TRANSACTION}">
  <input type="hidden" name="accepturl" value="{SUCCESS_URL}">
  <input type="hidden" name="cancelurl" value="{CANCEL_URL}">
  <input type="hidden" name="declineurl" value="{FAILURE_URL}">
  <input type="hidden" name="notifyurl" value="{NOTIFY_URL}">
</form>
```

## 6. QueryString URL Payment

Ce mode consiste a appeler `PayEntry` avec un parametre `data` contenant les attributs de paiement.

### 6.1 Exemple URL

```text
https://api.maxicashapp.com/payentry?data={PayType:"MaxiCash",Amount:"{TOTAL_AMOUNT}",Currency:"maxiDollar",Telephone:"{MAXICASH_TELEPHONE_NO}",MerchantID:"{YOUR_MERCHANT_ID}",MerchantPassword:"{YOUR_MERCHANT_PASSWORD}",Language:"fr",Reference:"{REFERENCE_OF_TRANSACTION}",Accepturl:"{SUCCESS_URL}",Cancelurl:"{CANCEL_URL}",Declineurl:"{FAILURE_URL}",NotifyURL:"{NOTIFY_URL}"}
```

### 6.2 Recommandation

Encoder correctement le contenu de `data` avec `encodeURIComponent` si l'URL est construite dynamiquement. Les valeurs comme les URLs de retour contiennent souvent `:`, `/`, `?`, `&` ou `=`.

## 7. Pay Entry Web

Cette methode est adaptee aux marchands qui souhaitent une architecture REST avant de rediriger le client vers la Gateway.

Flux :

1. Envoyer une requete API a `PayEntryWeb`.
2. Recevoir un `LogID`.
3. Rediriger l'utilisateur vers `payentryweb?logid={LogID}`.

### 7.1 Requete

```json
{
  "PayType": "MaxiCash",
  "MerchantID": "{YOUR_MERCHANT_ID}",
  "MerchantPassword": "{YOUR_MERCHANT_PASSWORD}",
  "Amount": "1000",
  "Currency": "maxiDollar",
  "Telephone": "{MAXICASH_TELEPHONE_NO}",
  "Language": "en",
  "Reference": "{REFERENCE_OF_TRANSACTION}",
  "SuccessURL": "{SUCCESS_URL}",
  "FailureURL": "{FAILURE_URL}",
  "CancelURL": "{CANCEL_URL}",
  "NotifyURL": "{NOTIFY_URL}"
}
```

### 7.2 Reponse

```json
{
  "SessionToken": null,
  "ResponseStatus": "success",
  "ResponseError": "",
  "ResponseData": "123456",
  "ResponseDesc": "LogID",
  "TransactionID": "sample string 6",
  "LogID": "123456",
  "Reference": null
}
```

### 7.3 Redirection gateway

```text
https://api-testbed.maxicashapp.com/payentryweb?logid=123456
```

## 8. Donate Button pour ONG

Une fois inscrit comme marchand ONG, MaxiCash fournit un script de bouton de donation a integrer sur le site.

### 8.1 Exemple bouton Sandbox

```html
<a id="mxc00">
  <script async src="https://api-testbed.maxicashapp.com/mxcashbtn.js"></script>
</a>
```

### 8.2 Donation directe

```text
https://api.maxicashapp.com/donationentry?data={MerchantID:"{YOUR_MERCHANT_ID}",Language:"fr"}
```

## 9. MaxiCash API

L'API MaxiCash permet de collecter un paiement depuis un utilisateur MaxiCash. Elle est principalement adaptee aux applications mobiles et aux interfaces web personnalisees.

Methodes disponibles :

- Paiement OTP SMS : `PayLaterSynch` puis `CompletePayLater`
- Paiement In-App synchrone : `PayNowSynch`
- Paiement In-App asynchrone : `PayNowAsynch` puis `PayNowStatus`

Les appels API sont effectues vers :

```text
https://api-testbed.maxicashapp.com/Merchant/api.asmx/{MethodName}
https://api.maxicashapp.com/Merchant/api.asmx/{MethodName}
```

## 10. Paiement OTP SMS

Ce flux est adapte aux applications mobiles.

Flux :

1. Initialiser le paiement avec `PayLaterSynch`.
2. L'utilisateur recoit un PIN par SMS.
3. Finaliser le paiement avec `CompletePayLater` en envoyant le `PaymentID` et le `PIN`.

### 10.1 PayLaterSynch

`PayLaterSynch` initialise un paiement et retourne un `PaymentID`.

```javascript
var PmtID = "";

function CallPayLaterSynch() {
  var a = new Object();
  a.Amount = 1000;
  a.Currency = "maxiDollar";
  a.Telephone = "{MAXICASH_TELEPHONE_NO}";
  a.MerchantID = "{YOUR_MERCHANT_ID}";
  a.MerchantPassword = "{YOUR_MERCHANT_PASSWORD}";
  a.Language = "en";
  a.Reference = "{REFERENCE_OF_TRANSACTION}";

  var payloadString = JSON.stringify(a);
  payloadString = payloadString.replace(/\"/g, '\\"');
  var vURL = "https://api-testbed.maxicashapp.com/Merchant/api.asmx/PayLaterSynch";

  $.ajax({
    type: "POST",
    url: vURL,
    data: '{strData: "' + payloadString + '" }',
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      var parsedResponse = typeof data.d == "string" ? eval("(" + data.d + ")") : data.d;
      if (parsedResponse[1] === "Success") {
        alert("An SMS has been sent to your MaxiCash number to finalize the payment");
        PmtID = parsedResponse[3];
      } else {
        alert("An error has occured: " + parsedResponse[2]);
      }
    },
    failure: function(e, textStatus, errorThrown) {
      alert("An error has occured: " + textStatus);
    }
  });
}
```

### 10.2 CompletePayLater

`CompletePayLater` finalise le paiement avec le `PaymentID` et le PIN recu par SMS.

```javascript
function CallValidatePayment(pin, PmtID) {
  var a = new Object();
  a.PaymentID = PmtID;
  a.PIN = pin;
  a.MerchantID = "{YOUR_MERCHANT_ID}";
  a.MerchantPassword = "{YOUR_MERCHANT_PASSWORD}";
  a.Language = "en";

  var payloadString = JSON.stringify(a);
  payloadString = payloadString.replace(/\"/g, '\\"');
  var vURL = "https://api-testbed.maxicashapp.com/Merchant/api.asmx/CompletePayLater";

  $.ajax({
    type: "POST",
    url: vURL,
    data: '{strData: "' + payloadString + '" }',
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      var parsedResponse = typeof data.d == "string" ? eval("(" + data.d + ")") : data.d;
      if (parsedResponse[1] === "Success") {
        alert("Your payment has been finalized");
      } else {
        alert("An error has occured: " + parsedResponse[2]);
      }
    },
    failure: function(e, textStatus, errorThrown) {
      alert("An error has occured: " + textStatus);
    }
  });
}
```

## 11. Paiement In-App synchrone

Le paiement In-App synchrone utilise `PayNowSynch`.

Flux :

1. Le marchand appelle `PayNowSynch`.
2. L'utilisateur recoit une notification dans l'application MaxiCash.
3. L'utilisateur a 60 secondes pour approuver.
4. L'API attend le statut jusqu'au timeout.

### 11.1 PayNowSynch

```javascript
function CallPayNowSynch() {
  var a = new Object();
  a.PayType = "MaxiCash";
  a.Amount = 1000;
  a.Currency = "maxiDollar";
  a.Telephone = "{MAXICASH_TELEPHONE_NO}";
  a.MerchantID = "{YOUR_MERCHANT_ID}";
  a.MerchantPassword = "{YOUR_MERCHANT_PASSWORD}";
  a.Language = "en";
  a.Reference = "{REFERENCE_OF_TRANSACTION}";

  var payloadString = JSON.stringify(a);
  payloadString = payloadString.replace(/\"/g, '\\"');
  var vURL = "https://api-testbed.maxicashapp.com/Merchant/api.asmx/PayNowSynch";

  $.ajax({
    type: "POST",
    url: vURL,
    data: '{strData: "' + payloadString + '" }',
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      var parsedResponse = typeof data.d == "string" ? eval("(" + data.d + ")") : data.d;
      if (parsedResponse[1] === "Success") {
        alert("Your payment was successful");
      } else {
        alert("An error has occured: " + parsedResponse[2]);
      }
    },
    failure: function(e, textStatus, errorThrown) {
      alert("An error has occured: " + textStatus);
    }
  });
}
```

## 12. Paiement In-App asynchrone

Ce flux est adapte aux sites web ou applications qui veulent une interface personnalisee et ne veulent pas bloquer pendant 60 secondes.

Flux :

1. Initialiser le paiement avec `PayNowAsynch`.
2. Recuperer `PaymentID` et `PType`.
3. Interroger regulierement `PayNowStatus`.
4. Rediriger ou finaliser l'interface selon le statut retourne.

### 12.1 PayNowAsynch

```javascript
var PmtID = "";
var PType = "";

function CallPayNowAsynch() {
  var a = new Object();
  a.PayType = "MaxiCash";
  a.Amount = 1000;
  a.Currency = "maxiDollar";
  a.Telephone = "{MAXICASH_TELEPHONE_NO}";
  a.MerchantID = "{YOUR_MERCHANT_ID}";
  a.MerchantPassword = "{YOUR_MERCHANT_PASSWORD}";
  a.Language = "en";
  a.Reference = "{REFERENCE_OF_TRANSACTION}";

  var payloadString = JSON.stringify(a);
  payloadString = payloadString.replace(/\"/g, '\\"');
  var vURL = "https://api-testbed.maxicashapp.com/Merchant/api.asmx/PayNowAsynch";

  $.ajax({
    type: "POST",
    url: vURL,
    data: '{strData: "' + payloadString + '" }',
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      var parsedResponse = typeof data.d == "string" ? eval("(" + data.d + ")") : data.d;
      if (parsedResponse[1] === "Success") {
        alert("Your payment was initialized. Please complete it on your Mobile device");
        PmtID = parsedResponse[3];
        PType = parsedResponse[6];
      } else {
        alert("An error has occured: " + parsedResponse[2]);
      }
    },
    failure: function(e, textStatus, errorThrown) {
      alert("An error has occured: " + textStatus);
    }
  });
}
```

### 12.2 PayNowStatus

La documentation source indique que `PayNowStatus` sert a verifier le statut d'un paiement synchrone/asynchrone MaxiCash ou Pepele Mobile. Elle mentionne les parametres `PmtID`, `PType`, `MerchantID`, `MerchantPassword` et `Language`.

> Attention : l'exemple source fourni pointe `vURL` vers `/CompletePayLater`, alors que le texte de la documentation parle de `PayNowStatus`. Pour une integration reelle, confirmer l'endpoint exact avec MaxiCash. L'endpoint attendu d'apres le nom de la methode serait probablement `/PayNowStatus`.

```javascript
function CallPayNowStatus(Pmt, PmtType) {
  var a = new Object();
  a.PmtID = Pmt;
  a.PType = PmtType;
  a.MerchantID = "{YOUR_MERCHANT_ID}";
  a.MerchantPassword = "{YOUR_MERCHANT_PASSWORD}";
  a.Language = "en";

  var payloadString = JSON.stringify(a);
  payloadString = payloadString.replace(/\"/g, '\\"');
  var vURL = "https://api-testbed.maxicashapp.com/Merchant/api.asmx/PayNowStatus";

  $.ajax({
    type: "POST",
    url: vURL,
    data: '{strData: "' + payloadString + '" }',
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      var parsedResponse = typeof data.d == "string" ? eval("(" + data.d + ")") : data.d;
      if (parsedResponse[1] === "Success") {
        window.location.href = parsedResponse[4];
        PmtID = parsedResponse[3];
      } else {
        alert("An error has occured: " + parsedResponse[2]);
      }
    },
    failure: function(e, textStatus, errorThrown) {
      alert("An error has occured: " + textStatus);
    }
  });
}
```

## 13. Structure des reponses API ASMX

Les exemples MaxiCash montrent des reponses parsees sous forme de tableau :

```javascript
var parsedResponse = typeof data.d == "string" ? eval("(" + data.d + ")") : data.d;
```

Indices observes dans les exemples :

| Index | Signification observee |
| --- | --- |
| `parsedResponse[1]` | Statut, par exemple `Success`. |
| `parsedResponse[2]` | Message d'erreur. |
| `parsedResponse[3]` | `PaymentID` ou identifiant transactionnel selon la methode. |
| `parsedResponse[4]` | URL de redirection dans le flux status. |
| `parsedResponse[6]` | Type de paiement `PType` dans le flux asynchrone. |

Eviter `eval` dans une implementation moderne. Preferer `JSON.parse` si MaxiCash retourne une chaine JSON valide.

## 14. Recommandations d'implementation serveur

Pour une application Next.js ou backend moderne :

- Appeler MaxiCash depuis une route serveur, pas directement depuis le navigateur, quand `MerchantPassword` est requis.
- Stocker `MerchantID` et `MerchantPassword` dans des variables d'environnement.
- Generer une `Reference` unique pour chaque transaction.
- Sauvegarder la transaction en base avant d'appeler MaxiCash.
- Traiter `notifyurl` comme source serveur de confirmation, puis reconciler avec la redirection utilisateur.
- Verifier le montant et la devise au retour de MaxiCash avant de marquer une commande comme payee.
- Journaliser `Reference`, `PaymentID`, `LogID`, statut, montant, devise et payload de reponse utile.
- Prevoir les statuts `pending`, `success`, `failed`, `cancelled` et `timeout`.

## 15. Variables d'environnement suggerees

```env
MAXICASH_ENV=sandbox
MAXICASH_MERCHANT_ID=your_merchant_id
MAXICASH_MERCHANT_PASSWORD=your_merchant_password

MAXICASH_API_SANDBOX_URL=https://api-testbed.maxicashapp.com/Merchant/api.asmx
MAXICASH_API_LIVE_URL=https://api.maxicashapp.com/Merchant/api.asmx

MAXICASH_GATEWAY_SANDBOX_URL=https://api-testbed.maxicashapp.com
MAXICASH_GATEWAY_LIVE_URL=https://api.maxicashapp.com

MAXICASH_WEBAPI_SANDBOX_URL=https://webapi-test.maxicashapp.com
MAXICASH_WEBAPI_LIVE_URL=https://webapi.maxicashapp.com
```

## 16. Checklist d'integration

- [ ] Obtenir `MerchantID` et `MerchantPassword`.
- [ ] Choisir le mode : Gateway, Pay Entry Web, OTP SMS, In-App synchrone ou In-App asynchrone.
- [ ] Configurer les endpoints Sandbox.
- [ ] Implementer la creation de reference unique.
- [ ] Envoyer les montants en cents.
- [ ] Implementer `accepturl`, `declineurl`, `cancelurl` et `notifyurl`.
- [ ] Sauvegarder les transactions en base.
- [ ] Tester succes, echec, annulation et timeout.
- [ ] Verifier la reconciliation serveur avec `notifyurl`.
- [ ] Passer les endpoints en Live apres validation MaxiCash.

## 17. Choix rapide du bon flux

| Besoin | Flux conseille |
| --- | --- |
| Site web simple | MaxiCash Gateway Form Post |
| Site web avec backend REST | Pay Entry Web |
| ONG / donation | Donate Button ou `donationentry` |
| Application mobile avec PIN SMS | `PayLaterSynch` + `CompletePayLater` |
| Paiement In-App avec attente directe | `PayNowSynch` |
| Interface personnalisee sans blocage 60s | `PayNowAsynch` + `PayNowStatus` |

