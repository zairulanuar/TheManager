
import unittest
import sys
import os
import re
sys.path.append(os.getcwd())
from scripts.extractor.llp import extract_llp

class TestLLPFix1(unittest.TestCase):
    def test_llp_requirements(self):
        # Simulated OCR lines based on user feedback
        lines = [
            "CERTIFICATE OF REGISTRATION OF",
            "LIMITED LIABILITY PARTNERSHIP",
            "LIMITED LIABILITY PARTNERSHIPS ACT 2012 (ACT 743)",
            "This is to certify that",
            "ANALOG DATA GROUP PLT",
            "was registered on the 11th day of January 2022",
            "Dated at KUALA LUMPUR this 19th day of September 2022",
            "DATUK Mae AZIZ", # Simulated OCR noise
            "REGISTRAR OF LIMITED LIABILITY PARTNERSHIPS",
            "MALAYSIA"
        ]
        
        result = extract_llp(lines)
        
        print("\n--- Results (Perfect OCR) ---")
        print(f"Document Title: {result.get('documentTitle')}")
        print(f"Legal Basis: {result.get('legalBasis')}")
        print(f"Registration Date: {result.get('registrationDate')}")
        print(f"Issue Place: {result.get('issuePlace')}")
        print(f"Issue Date: {result.get('issueDate')}")
        print(f"Signing Officer: {result.get('signingOfficer')}")
        
        self.assertEqual(result["registrationDate"], "2022-01-11")
        self.assertEqual(result["issueDate"], "2022-09-19")
        self.assertNotEqual(result["registrationDate"], result["issueDate"])

    def test_llp_date_fallback(self):
        # Case 2: Missing registration date line
        lines = [
            "CERTIFICATE OF REGISTRATION OF",
            "LIMITED LIABILITY PARTNERSHIP",
            "LIMITED LIABILITY PARTNERSHIPS ACT 2012 (ACT 743)",
            "This is to certify that",
            "ANALOG DATA GROUP PLT",
            "was registered on the [BLURRED] day of [BLURRED]", # Unparseable
            "Dated at KUALA LUMPUR this 19th day of September 2022",
            "DATUK NOR AZIMAH ABDUL AZIZ",
            "REGISTRAR OF LIMITED LIABILITY PARTNERSHIPS",
            "MALAYSIA"
        ]
        
        result = extract_llp(lines)
        
        print("\n--- Results (Fallback Test) ---")
        print(f"Registration Date: {result.get('registrationDate')}")
        print(f"Issue Date: {result.get('issueDate')}")
        
        self.assertEqual(result["issueDate"], "2022-09-19")
        self.assertEqual(result["registrationDate"], "2022-09-19", "Should fallback to issue date")
        self.assertIn("Registration date inferred from issue date.", result["notes"])

if __name__ == '__main__':
    unittest.main()
