
import unittest
import sys
import os
import re
sys.path.append(os.getcwd())
from scripts.extractor.form_9 import extract_form_9

class TestForm9Fix3(unittest.TestCase):
    def test_fix_3_requirements(self):
        # Simulated OCR lines based on user feedback
        # Case 1: All info present (Perfect OCR)
        lines = [
            "FORM 9",
            "CERTIFICATE OF INCORPORATION",
            "PRIVATE COMPANY",
            "This is to certify that",
            "ANALOG DATA SDN BHD",
            "is, on and from the 7th day of June 2007, incorporated under",
            "the Companies Act 1965",
            "Dated at KL this 7th day of June 2007",
            "SSN.) 8 Svea DATUK NOR AZIMAH ABDUL AZIZ",
            "REGISTRAR OF COMPANIES MALAYSIA"
        ]
        
        result = extract_form_9(lines)
        
        print("\n--- Results (Perfect OCR) ---")
        print(f"Registration Date: {result.get('registrationDate')}")
        print(f"Valid Until: {result.get('validUntil')}")
        print(f"Registered Address: {result.get('registeredAddress')}")
        print(f"Signing Officer: {result.get('signingOfficer')}")
        
        self.assertEqual(result["registrationDate"], "2007-06-07")
        self.assertIsNone(result["validUntil"])
        self.assertIsNone(result["registeredAddress"])
        self.assertEqual(result["signingOfficer"], "DATUK NOR AZIMAH ABDUL AZIZ")

    def test_registration_date_fallback(self):
        # Case 2: Registration date line garbled/missing, but Issue date present
        lines = [
            "FORM 9",
            "CERTIFICATE OF INCORPORATION",
            "PRIVATE COMPANY",
            "This is to certify that",
            "ANALOG DATA SDN BHD",
            "is, on and from the [BLURRED] day of [BLURRED], incorporated under",
            "the Companies Act 1965",
            "Dated at KL this 7th day of June 2007",
            "DATUK NOR AZIMAH ABDUL AZIZ",
            "REGISTRAR OF COMPANIES MALAYSIA"
        ]
        
        result = extract_form_9(lines)
        
        print("\n--- Results (Fallback Test) ---")
        print(f"Registration Date: {result.get('registrationDate')}")
        print(f"Issue Date: {result.get('issueDate')}")
        
        self.assertEqual(result["issueDate"], "2007-06-07")
        self.assertEqual(result["registrationDate"], "2007-06-07", "Should fallback to issue date")
        self.assertIn("Registration date inferred from issue date.", result["notes"])

if __name__ == '__main__':
    unittest.main()
