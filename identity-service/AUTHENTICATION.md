# Registration, login και JWT

## Επίλυση usernames για συνομιλίες

Το `POST /api/users/resolve-usernames` απαιτεί bearer JWT και ενεργό λογαριασμό.
Δέχεται `{"usernames":["alice","bob"]}` με 1–99 ονόματα και επιστρέφει μόνο
`[{"uuid":"…","username":"alice"},…]`, με `Cache-Control: no-store`.
Κενά/μη έγκυρα ονόματα απορρίπτονται με 400, άγνωστοι ή απενεργοποιημένοι
χρήστες με 404, χωρίς μερική απάντηση. Δεν επιστρέφονται email, τηλέφωνο ή ημερομηνία γέννησης.
Η σύγκριση ακολουθεί το collation της στήλης `users.username`, όπως η υπάρχουσα
μοναδικότητα και το login· ο κώδικας δεν μετατρέπει τα ονόματα σε πεζά.
Το schema και το Docker init δεν ορίζουν explicit collation. Σε υπάρχουσα βάση
ελέγχεται με `SHOW FULL COLUMNS FROM users LIKE 'username'`.

## Swagger UI

Με την υπηρεσία σε λειτουργία, άνοιξε [Swagger UI](http://localhost:8082/swagger-ui/index.html).
Το OpenAPI JSON βρίσκεται στο `/v3/api-docs`. Οι GET διαδρομές τεκμηρίωσης είναι public.
Κάνε register/login, αντίγραψε το `accessToken`, πάτησε **Authorize** και βάλε μόνο το token,
χωρίς το πρόθεμα `Bearer`. Το UI προσθέτει αυτόματα το header για τα `/api/users/me`.
Τα register/login δεν απαιτούν token. Η τεκμηρίωση δεν αλλάζει την authorization των API routes.
Χρησιμοποιείται [springdoc 3.1.1](https://springdoc.org/getting-started.html), για Spring Boot 4.

Η υπηρεσία εκδίδει JWT access tokens με RSA/RS256. Το ιδιωτικό κλειδί υπάρχει μόνο στην identity-service. Άλλες υπηρεσίες θα χρειάζονται μόνο το δημόσιο κλειδί και την ίδια τιμή issuer για επαλήθευση. Δεν προστέθηκαν refresh tokens, JWKS ή OpenID discovery endpoints.

## Τοπικά κλειδιά και configuration

Τα κλειδιά φορτώνονται κατά την εκκίνηση. Χρειάζονται PEM **PKCS#8 private key** και **X.509 public key**, ίδιο RSA ζεύγος, τουλάχιστον 2048 bits. Δεν δημιουργούνται αυτόματα ούτε περιλαμβάνονται στο source. Αν λείπουν ή είναι ασύμβατα, η εκκίνηση αποτυγχάνει.

Για τοπική δημιουργία, εκτέλεσε το παρακάτω σε **PowerShell 7**. Γράφει κλειδιά σε φάκελο εκτός repository και δεν εμφανίζει το περιεχόμενό τους. Δεν αντικαθιστά υπάρχοντα αρχεία:

```powershell
$identityKeyDirectory = Join-Path $env:USERPROFILE '.messenger-identity-keys'
$identityPrivateKeyPath = Join-Path $identityKeyDirectory 'private.pem'
$identityPublicKeyPath = Join-Path $identityKeyDirectory 'public.pem'
if ((Test-Path -LiteralPath $identityPrivateKeyPath) -or
    (Test-Path -LiteralPath $identityPublicKeyPath)) {
    throw 'Key files already exist; use the existing pair instead of overwriting it.'
}
New-Item -ItemType Directory -Path $identityKeyDirectory -Force | Out-Null
$identityRsa = [System.Security.Cryptography.RSA]::Create(3072)
try {
    $identityEncoding = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($identityPrivateKeyPath, $identityRsa.ExportPkcs8PrivateKeyPem(), $identityEncoding)
    [System.IO.File]::WriteAllText($identityPublicKeyPath, $identityRsa.ExportSubjectPublicKeyInfoPem(), $identityEncoding)
} finally {
    $identityRsa.Dispose()
}
```

Περιόρισε την πρόσβαση στο ιδιωτικό αρχείο μέσω των Windows file permissions στον λογαριασμό που εκτελεί την υπηρεσία και στους απαραίτητους διαχειριστές. Μην το ανεβάσεις σε git, μην το αντιγράψεις σε άλλες υπηρεσίες και μην το συμπεριλάβεις σε logs. Τα PEM/key αρχεία και τα τοπικά `.env` είναι επιπλέον αποκλεισμένα από το `.gitignore`.

Στο ίδιο terminal, για το `bootRun`, όρισε:

```powershell
$env:IDENTITY_JWT_PRIVATE_KEY = 'file:' + $identityPrivateKeyPath.Replace('\', '/')
$env:IDENTITY_JWT_PUBLIC_KEY = 'file:' + $identityPublicKeyPath.Replace('\', '/')
$env:IDENTITY_JWT_ISSUER = 'http://localhost:8082'
$env:IDENTITY_JWT_ACCESS_TOKEN_TTL = 'PT15M'
.\gradlew.bat bootRun
```

Αν τα αρχεία υπάρχουν ήδη, όρισε τις δύο μεταβλητές path στις υπάρχουσες διαδρομές πριν χρησιμοποιήσεις το παραπάνω block. Για IDE run configuration, χρησιμοποίησε αντίστοιχες τιμές όπως `file:C:/Users/<user>/.messenger-identity-keys/private.pem`. Οι environment variables του terminal δεν μεταφέρονται σε ήδη ανοιχτό IDE.

Χρειάζονται επίσης οι υπάρχουσες `IDENTITY_DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. Η διεύθυνση βάσης πρέπει να ξεκινά με `jdbc:mysql://`. Η εφαρμογή παραμένει στη θύρα 8082, με Flyway και `ddl-auto=validate`.

| Environment variable | Χρήση | Default |
| --- | --- | --- |
| `IDENTITY_JWT_PRIVATE_KEY` | Εξωτερικό PKCS#8 PEM resource | Υποχρεωτικό |
| `IDENTITY_JWT_PUBLIC_KEY` | Εξωτερικό X.509 PEM resource | Υποχρεωτικό |
| `IDENTITY_JWT_ISSUER` | Ακριβής αναμενόμενος issuer | `http://localhost:8082` |
| `IDENTITY_JWT_ACCESS_TOKEN_TTL` | Θετική διάρκεια ISO-8601, τουλάχιστον 1 δευτερόλεπτο | `PT15M` |

Σε deployment χρησιμοποίησε σταθερό issuer και HTTPS. Η επαλήθευση διαβάζει το τοπικό δημόσιο κλειδί, δεν καλεί τη διεύθυνση issuer. Η ρύθμιση `issuer-uri` από μόνη της σε άλλη υπηρεσία δεν αρκεί, αφού εδώ δεν παρέχεται discovery endpoint.

## Διαδρομές για πραγματική δοκιμή

### POST /api/auth/register

Public. Απαιτεί έγκυρα πεδία σύμφωνα με το `UserInsertDTO`:

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "local-test-password",
  "dateOfBirth": "2000-01-01",
  "phoneNumber": "+301234567890"
}
```

Επιστρέφει **201** και `uuid`, `username`, `email`, `dateOfBirth`, `phoneNumber`, `createdAt`, `updatedAt`. Δεν επιστρέφει password/hash, numeric id ή soft-delete πεδία. Δεν εκδίδει token στην εγγραφή· ακολουθεί login. Δεν προστίθεται Location header προς ανύπαρκτο user endpoint.

### POST /api/auth/login

Public. Το `identifier` δέχεται ακριβώς username, email ή phone number:

```json
{
  "identifier": "alice",
  "password": "local-test-password"
}
```

Επιστρέφει **200**:

```json
{
  "accessToken": "<signed JWT>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Το JWT περιλαμβάνει μόνο `sub` (UUID από την οντότητα), `iss`, `iat`, `exp`. Δεν περιλαμβάνει password, email, τηλέφωνο ή αυθαίρετο UUID από request. Οι token responses έχουν `Cache-Control: no-store`.

Η αναζήτηση γίνεται για ενεργούς χρήστες και επιστρέφει λίστα υποψηφίων. Αν, π.χ., το username ενός χρήστη ισούται με το τηλέφωνο άλλου, το login αποτυγχάνει γενικά, ακόμη και αν ο κωδικός ταιριάζει με έναν από αυτούς. Δεν επιλέγεται λογαριασμός αυθαίρετα. Ένας λογαριασμός που ταιριάζει σε περισσότερα από ένα δικά του πεδία εμφανίζεται μία φορά. Η σύγκριση ακολουθεί το MySQL collation της βάσης· δεν προστέθηκε normalization.

Λάθος password, ανύπαρκτος/διαγραμμένος λογαριασμός και αμφίσημο identifier επιστρέφουν **401** με το ίδιο `Invalid credentials`. Χρησιμοποιείται dummy BCrypt hash όταν δεν υπάρχει μοναδικός ενεργός υποψήφιος.

## Security και errors

- Public API είναι μόνο οι δύο συγκεκριμένες POST διαδρομές. Οι GET/PATCH/DELETE `/api/users/me` και POST `/internal/users/validate-participants` απαιτούν επαληθευμένο bearer JWT και ενεργό χρήστη στη βάση. Όλες οι άλλες διαδρομές είναι αποκλεισμένες, ακόμη και με έγκυρο token. Δεν εκτέθηκαν list ή προφίλ άλλου χρήστη endpoints.
- Η υποδομή bearer authentication επαληθεύει RS256 signature, issuer, expiry/nbf, παρουσία iat/exp και UUID subject. Οι timestamp validators της Spring Security επιτρέπουν το προεπιλεγμένο clock skew περίπου 60 δευτερολέπτων.
- Stateless: χωρίς form login, Basic authentication, cookie authentication ή server session. CSRF είναι απενεργοποιημένο για αυτή τη ροή που χρησιμοποιεί μόνο το `Authorization: Bearer <token>` header. Αν προστεθεί cookie auth, χρειάζεται επανεξέταση.
- Δεν υπάρχει ακόμη ανάκληση access token: token που εκδόθηκε πριν από soft delete ή αλλαγή password παραμένει κρυπτογραφικά έγκυρο μέχρι τη λήξη. Στις self διαδρομές ελέγχεται ο ενεργός χρήστης σε κάθε ενέργεια, οπότε μετά από soft delete το παλιό token δεν επιτρέπει ανάγνωση/ενημέρωση/διαγραφή. Η αλλαγή password δεν ανακαλεί παλιά tokens. Άλλες υπηρεσίες θα χρειαστούν αντίστοιχη πολιτική.
- Δεν προστέθηκαν scopes/roles/audience policy. Άλλες υπηρεσίες θα χρειαστούν δική τους authorization policy, όχι μόνο επαλήθευση υπογραφής.
- Τα errors είναι JSON problem details. Invalid JSON/validation: **400**. Duplicate από precheck: **409**, χωρίς λεπτομέρειες λογαριασμού. Άλλα database/runtime failures: γενικό **500**, χωρίς SQL ή rejected passwords.
- Τα unique constraints παραμένουν η προστασία έναντι concurrency. Ένα concurrent database conflict δεν μεταφράζεται αυτόματα σε duplicate error, ώστε να μη χαρακτηρίζονται άσχετα integrity errors ως διπλότυπα.

## Προφίλ του συνδεδεμένου χρήστη

Κάθε request απαιτεί:

```http
Authorization: Bearer <accessToken>
```

Ο controller παίρνει το UUID μόνο από το `sub` του επαληθευμένου JWT. Δεν υπάρχει UUID στο path των self endpoints ούτε πεδίο UUID στα DTOs. Query/body UUID δεν χρησιμοποιούνται για επιλογή χρήστη. Το service ελέγχει `deleted = false` σε κάθε operation.

| Endpoint | Request | Επιτυχία |
| --- | --- | --- |
| `GET /api/users/me` | Χωρίς body | `200`, UserReadDTO με το δικό σου προφίλ |
| `PATCH /api/users/me` | Μόνο τα πεδία που θέλεις να αλλάξεις | `200`, ενημερωμένο UserReadDTO |
| `DELETE /api/users/me` | Επιβεβαίωση password | `204`, χωρίς body |

Το PATCH δέχεται μόνο τα πεδία που θέλεις να αλλάξεις. Πεδία που παραλείπονται ή είναι `null` διατηρούν την υπάρχουσα τιμή· δεν καθαρίζονται. Το `{}` είναι αποδεκτό ως no-op. Κενά/άκυρα πεδία που παρέχονται απορρίπτονται με 400. Το PUT δεν υποστηρίζεται πλέον. Το password μπορεί να παραλειφθεί ή να είναι `null`, ώστε να διατηρηθεί το υπάρχον hash. Αν δοθεί διαφορετικό password, κωδικοποιείται με BCrypt από το service. Το ίδιο password δεν ξανακωδικοποιείται.

```json
{
  "username": "alice_updated",
  "email": "alice_updated@example.com",
  "dateOfBirth": "2000-01-01",
  "phoneNumber": "+301234567890"
}
```

DELETE body:

```json
{
  "password": "local-test-password"
}
```

Η διαγραφή θέτει `deleted = true` και `deletedAt`, χωρίς αφαίρεση της γραμμής. Μετά τη διαγραφή, GET/PATCH/DELETE με το ίδιο token επιστρέφουν **404** (`Active user not found`). Λάθος confirmation password επιστρέφει **401** (`Invalid credentials`) χωρίς διαγραφή. Άκυρο/ελλιπές JSON ή DTO: **400**. Duplicate προφίλ από precheck: **409**. Missing/invalid/expired JWT: **401** πριν από τον controller.

Οι responses προφίλ έχουν `Cache-Control: no-store` και δεν περιέχουν password/hash, numeric id ή soft-delete πεδία. Οι `/api/users`, `/api/users/{uuid}` και μη επιτρεπόμενες μέθοδοι παραμένουν **403** με έγκυρο JWT. Τα `getAllUsers`/`getUserByUuid` παραμένουν service methods, χωρίς δημόσιο endpoint για όλους ή για άλλον χρήστη. Δεν υπάρχουν admin roles.

## Τι έχει επαληθευτεί

### Έλεγχος συμμετεχόντων για το chat-service

Το `POST /internal/users/validate-participants` δέχεται `{"userUuids":["<UUID>"]}`: 1–100 διαφορετικά, μη null UUID. Το chat προωθεί το bearer token του caller. Το identity επαληθεύει το token και τον ενεργό caller, και μετρά όσους από τους ζητούμενους χρήστες έχουν `deleted = false`. Επιστρέφει **200** με μόνο `{"allActive":true}` ή `{"allActive":false}` και `Cache-Control: no-store`, χωρίς προσωπικά στοιχεία ή λίστα των UUID που λείπουν. Άκυρο body: **400**, missing/invalid token: **401**, ανύπαρκτος/διαγραμμένος caller: **404**.

Η διαδρομή είναι κρυμμένη από το Swagger. Το όνομα `internal` δεν επιβάλλει περιορισμό δικτύου: στην παρούσα υλοποίηση κάθε ενεργός χρήστης με έγκυρο JWT μπορεί να καλέσει τον έλεγχο. Δεν προστέθηκαν service credentials ή ξεχωριστοί ρόλοι. Η δοκιμή καλύπτει authentication, validation και τη boolean απάντηση με mocked repository.

Το compilation και τα στοχευμένα tests καλύπτουν BCrypt credential checks, τις τρεις μορφές identifier, invalid/deleted/ambiguous login, issuance και validation JWT, φόρτωση PEM/mismatched keys, HTTP validation και public POST routes. Τα user HTTP tests χρησιμοποιούν πραγματικό MVC/security filter chain και UserService με mocked repository, χωρίς MySQL: ownership από υπογεγραμμένο subject, μη έκθεση password, password confirmation, απόρριψη malformed/expired/άλλου κλειδιού JWT, αποκλεισμό list/other-user routes και όλες τις self ενέργειες μετά από soft delete. Τα RSA test keys δημιουργούνται μόνο στη μνήμη.

```powershell
.\gradlew.bat compileJava test --tests com.project.messenger.identity.service.UserServiceTest --tests com.project.messenger.identity.service.AuthServiceTest --tests com.project.messenger.identity.security.jwt.JwtServiceTest --tests com.project.messenger.identity.controller.AuthControllerTest --tests com.project.messenger.identity.controller.UserControllerTest
```

Το υπάρχον `IdentityServiceApplicationTests.contextLoads` απαιτεί τη βάση και τα πραγματικά εξωτερικά κλειδιά και δεν περιλαμβάνεται στους απομονωμένους ελέγχους. Η πρώτη πραγματική δοκιμή είναι: εκκίνηση με τη νέα βάση και το δικό σου ζεύγος κλειδιών, register, έλεγχος UUID/timestamps/hash στη βάση και login με καθεμία από τις τρεις μορφές identifier. Μην μοιραστείς password, private key ή πλήρες access token.

Επίσημες αναφορές: [Spring Security JWT Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html), [NimbusJwtEncoder](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/oauth2/jwt/NimbusJwtEncoder.html).
