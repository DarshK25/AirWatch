import React from 'react';
import AQIBackground from './components/AQIBackground';
import RegistrationHeader from './components/RegistrationHeader';
import RegistrationForm from './components/RegistrationForm';

const Register = () => {
  return (
    <AQIBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Registration Card */}
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-8">
            <RegistrationHeader />
            <RegistrationForm />
          </div>

          {/* Additional Information */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Secure registration powered by advanced encryption
            </p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <span className="text-xs text-muted-foreground">🔒 SSL Protected</span>
              <span className="text-xs text-muted-foreground">🛡️ GDPR Compliant</span>
              <span className="text-xs text-muted-foreground">🇮🇳 CPCB Certified</span>
            </div>
          </div>
        </div>
      </div>
    </AQIBackground>
  );
};

export default Register;