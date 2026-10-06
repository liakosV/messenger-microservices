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
        <label>
          Ημερομηνία γέννησης
          <input
            name="dateOfBirth"
            type="date"
            max={new Date(Date.now() - 86400000).toISOString().slice(0, 10)}
            required
          />
        </label>
        <label>
          Τηλέφωνο
          <input
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            maxLength={255}
            placeholder="+30…"
            required
          />
        </label>
      </div>
    </>
  );
}
