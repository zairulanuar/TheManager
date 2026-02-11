import sys
import os

# Add project root to sys.path so we can import scripts
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.extractor.form_9 import extract_form_9

SAMPLE_BLOCKS = [
    "COMPANIES ACT 2016 (ACT 777)",
    "CERTIFICATE OF INCORPORATION OF PRIVATE COMPANY",
    "This is to certify that",
    "ANALOG DATA SDN BHD",
    "190933432134 (1234567-H)",
    "is, on and from the 7th day of June 2007, incorporated under the Companies Act 1965,",
    "and that the company is a company limited by shares and that the company is a private company.",
    "Dated at KL this 7th day of June 2007.",
    "DATUK NOR AZIMAH ABDUL AZIZ",
    "REGISTRAR OF COMPANIES MALAYSIA"
]

def test_extract_form_9_minimal():
    fields = extract_form_9(SAMPLE_BLOCKS)
    print("Extracted Fields:", fields)
    
    assert fields["doc_type"] == "FORM_9"
    assert fields["entity_name"] == "ANALOG DATA SDN BHD"
    assert fields["registration_number_new"] == "190933432134"
    assert fields["registration_number_old"] == "1234567-H"
    assert fields["incorporation_or_registration_date"] == "2007-06-07"
    assert fields["issue_place"] == "KL"
    assert fields["issue_date"] == "2007-06-07"
    assert fields["signing_officer"].upper().startswith("DATUK")
    print("Test Passed!")

if __name__ == "__main__":
    test_extract_form_9_minimal()
