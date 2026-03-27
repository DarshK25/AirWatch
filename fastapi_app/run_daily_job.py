import sys
import os
from datetime import datetime

# Add the project root to the path to allow module imports from 'app.*'
sys.path.append(os.path.dirname(__file__))

# Local imports
from app.core.db import SessionLocal
from app.services.prediction_service import generate_and_save_predictions

if __name__ == '__main__':
    print(f"--- DAILY PREDICTION JOB STARTED --- ({datetime.now().isoformat()})")
    
    db_session = SessionLocal()
    try:
        # This function loads the trained model, generates the 48-hour prediction, 
        # clears old predictions, and saves the new ones to the database.
        generate_and_save_predictions(db_session)
        
    except Exception as e:
        print(f"DAILY JOB FAILED: {e}")
        # In case of an error, ensure the transaction is rolled back
        db_session.rollback() 
    finally:
        db_session.close()
        
    print(f"--- DAILY PREDICTION JOB FINISHED --- ({datetime.now().isoformat()})")