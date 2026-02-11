
import unittest
import sys
import os
sys.path.append(os.getcwd())
from scripts.extractor.form_d import extract_form_d

class TestFormDFix3(unittest.TestCase):
    def test_fix_3_requirements(self):
        text_lines = [
            "FORM D (RULE 13)",
            "CERTIFICATE OF REGISTRATION",
            "THE REGISTRATION OF BUSINESSES ACT 1956 (ACT 197)",
            "This is to certify that",
            "Something Something",
            "and branch at 15 &amp; 17, JALAN CYBER 16"
        ]
        
        result = extract_form_d(text_lines)
        
        # Check Document Title
        expected_title_part1 = "CERTIFICATE OF REGISTRATION"
        expected_title_part2 = "THE REGISTRATION OF BUSINESSES ACT 1956 (ACT 197)"
        
        print(f"Doc Title: {result['document_title']}")
        # The user wants them combined. The current logic might pick one.
        # Requirement: "CERTIFICATE OF REGISTRATION; THE REGISTRATION OF BUSINESSES ACT 1956 (ACT 197)"
        # Or just ensuring both are present.
        
        # Check Legal Basis
        print(f"Legal Basis: {result['legal_basis']}")
        # Requirement: Structured object
        
        # Check Branch Address
        print(f"Branch Addresses: {result['branch_addresses']}")
        self.assertTrue(any("&" in addr and "&amp;" not in addr for addr in result['branch_addresses']), "Branch address should be unescaped")

if __name__ == '__main__':
    unittest.main()
