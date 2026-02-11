
import sys
import os
import json

# Add scripts directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from extractor.form_9 import extract_form_9

def test_form_9_extraction():
    # Test Case 1: Standard Form 9 with known artifacts
    raw_text_1 = """
    BORANG 9
    AKTA SYARIKAT 1965
    [Seksyen 17]
    NO. SYARIKAT
    888888-X
    PERAKUAN PEMERBADANAN SYARIKAT SENDIRIAN
    Ini adalah untuk memperakui bahawa
    MY AWESOME COMPANY SDN. BHD.
    adalah, pada dan mulai dari 7* day of June 2007, diperbadankan di bawah Akta Syarikat 1965,
    dan bahawa syarikat ini adalah sebuah syarikat sendirian.
    Dated at KE this 7* day of June 2007.
    PENGALAMAN
    JATUK NOR ABDUL AZIZ
    PENDAFTAR SYARIKAT MALAYSIA
    """
    
    print("--- Test Case 1: Artifacts ---")
    result_1 = extract_form_9(raw_text_1.strip().split('\n'))
    print(json.dumps(result_1, indent=2))
    
    # Verifications
    assert result_1["docType"] == "FORM_9"
    assert result_1["registrationNumber"] == "888888-X" or result_1["oldRegistrationNumber"] == "888888-X"
    # Cleaner strips trailing punctuation, so "SDN. BHD." becomes "SDN. BHD"
    assert "MY AWESOME COMPANY SDN. BHD" in result_1["companyName"]
    assert "DATUK" in result_1["signingOfficer"]
    assert "NOR AZIMAH" in result_1["signingOfficer"]
    assert result_1["issuePlace"] == "KL"
    assert "7th" in str(result_1["notes"]) or "normalized" in str(result_1["notes"])

    # Test Case 2: New Registration Number Format
    raw_text_2 = """
    FORM 9
    COMPANIES ACT 2016
    SECTION 17
    REGISTRATION NO.
    202001000001 (123456-A)
    CERTIFICATE OF INCORPORATION OF PRIVATE COMPANY
    This is to certify that
    ANOTHER TECH SDN. BHD.
    is, on and from the 10th day of January 2020, incorporated under the Companies Act 2016,
    and that the company is a private company limited by shares.
    Dated at KUALALUMPUR this 10th day of January 2020.
    REGISTRAR OF COMPANIES MALAYSIA
    """
    
    print("\n--- Test Case 2: New Format ---")
    result_2 = extract_form_9(raw_text_2.strip().split('\n'))
    print(json.dumps(result_2, indent=2))
    
    assert result_2["registrationNumber"] == "202001000001"
    assert result_2["oldRegistrationNumber"] == "123456-A"
    assert "ANOTHER TECH SDN. BHD" in result_2["companyName"]
    assert result_2["issuePlace"] == "KUALALUMPUR"

if __name__ == "__main__":
    try:
        test_form_9_extraction()
        print("\n✅ All tests passed!")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
