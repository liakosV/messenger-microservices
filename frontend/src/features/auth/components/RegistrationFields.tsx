import { DateOfBirthField } from '../../../shared/components/DateOfBirthField';
import { PhoneField } from '../../../shared/components/PhoneField';
export function RegistrationFields() {
  return (
    <>
      <label>
        Όνομα χρήστη
        <input
          name="username"
          autoComplete="username"
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9._\-]+"
          placeholder="π.χ. alex"
          required
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={255}
          placeholder="you@example.com"
          required
        />
      </label>
      <div className="form-row">
        <DateOfBirthField />
        <PhoneField />
      </div>
    </>
  );
}
