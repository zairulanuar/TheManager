
import unittest
from scripts.extractor.form_d import extract_form_d
import html

class TestReproduction(unittest.TestCase):
    def test_user_case(self):
        # Exact text structure from user feedback
        # Note: User says OCR text is "15 & 17", but result is "15 &amp; 17".
        # If I pass "15 & 17", result should be "15 & 17".
        # If I pass "15 &amp; 17", result should be "15 & 17" (after fix).
        
        lines = [
            "FORM D (RULE 13)",
            "CERTIFICATE OF REGISTRATION",
            "THE REGISTRATION OF BUSINESSES ACT 1956 (ACT 197)",
            "This is to certify that",
            "SOME COMPANY NAME",
            "under the name",
            "SOME NAME",
            "has this day been registered",
            "and branch at 15 &amp; 17, JALAN CYBER 16",
            "Dated at KUALA LUMPUR this 02 MARCH 2017",
            "REGISTRAR OF BUSINESSES"
        ]
        
        result = extract_form_d(lines)
        
        print("\n--- Results ---")
        print(f"Doc Title: {result.get('document_title')}")
        print(f"Legal Basis: {result.get('legal_basis')}")
        print(f"Branch Addresses: {result.get('branch_addresses')}")
        
        # Checks
        # 1. Document Title
        expected_title_part = "CERTIFICATE OF REGISTRATION"
        # My logic combines them with semicolon
        self.assertIn("CERTIFICATE OF REGISTRATION", result["document_title"])
        self.assertIn("THE REGISTRATION OF BUSINESSES ACT 1956 (ACT 197)", result["document_title"])
        
        # 2. Legal Basis
        self.assertIsInstance(result["legal_basis"], dict)
        self.assertEqual(result["legal_basis"]["actName"], "Registration of Businesses Act 1956")
        self.assertEqual(result["legal_basis"]["actNumber"], "Act 197")
        
        # 3. Branch Address
        # It should be unescaped
        self.assertEqual(result["branch_addresses"][0], "15 & 17, JALAN CYBER 16")

if __name__ == '__main__':
    import sys
    import os
    # Add project root to path
    sys.path.append(os.getcwd())
    unittest.main()
