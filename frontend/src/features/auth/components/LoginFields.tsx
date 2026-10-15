import { useState } from 'react';
import { RegistrationPhoneField, registrationPhone } from './RegistrationPhoneField';

export function LoginFields() {
  const [phone, setPhone] = useState(false);
  const [identifier, setIdentifier] = useState('');
  // Only explicit international identifiers are normalized in the general mode.
  // Numeric usernames remain usernames; national numbers use the phone mode.
  const canonical = /^(\+|00)[\d\s()-]+$/.test(identifier.trim())
    ? registrationPhone(identifier, 'GR')
    : identifier;
  return (
    <div className="login-fields">
      <div className="login-methods" role="group" aria-label="Τρόπος σύνδεσης">
        <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)}>
          Με όνομα / email
        </button>
        <button type="button" aria-pressed={phone} onClick={() => setPhone(true)}>
          Με τηλέφωνο
        </button>
      </div>
      {phone ? (
        <RegistrationPhoneField name="identifier" />
      ) : (
        <label>
          Όνομα χρήστη ή email
          <input
            autoComplete="username"
            placeholder="Πώς σε βρίσκουμε;"
            maxLength={255}
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
          <input type="hidden" name="identifier" value={canonical} />
        </label>
      )}
    </div>
  );
}
