import { MessageCircle } from 'lucide-react';
import { Brand } from '../../../shared/components/Brand';
export function AuthStory() {
  return (
    <section className="auth-story">
      <Brand />
      <div className="story-content">
        <span className="eyebrow">ΛΙΓΟ ΠΙΟ ΚΟΝΤΑ</span>
        <h1>
          Μια κουβέντα.
          <br />
          Πολλές συνδέσεις.
        </h1>
        <p>Ένα ήσυχο μέρος για τις καθημερινές σου συνομιλίες. Απλό, άμεσο, δικό σου.</p>
        <div className="illustration" aria-hidden="true">
          <div className="illustration-bubble first">
            Γεια! Πώς πάει; <span>14:32</span>
          </div>
          <div className="illustration-bubble second">
            Ωραία. Τα λέμε εδώ 🌿 <span>14:33 ✓✓</span>
          </div>
          <div className="illustration-orbit">
            <MessageCircle size={30} />
          </div>
        </div>
      </div>
      <div className="story-footer">
        <span className="status-dot" /> Οι καλές κουβέντες ξεκινούν εδώ.
      </div>
    </section>
  );
}
