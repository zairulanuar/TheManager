
import re
import sys
import os

# Add scripts directory to path to allow importing extractor
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from scripts.extractor.form_d import parse_registration_no_strict, parse_dated_at_strict, extract_form_d

def test_strict_parsing():
    test_cases_reg = [
        ("REGISTRATION NO : 202003000123 (RT12345-M)", "202003000123", "RT12345-M"),
        ("REGISTRATION NO. 202003000123 (RT12345-M)", "202003000123", "RT12345-M"),
        ("REGISTRATION NO\n: 202003000123 (RT12345-M)", "202003000123", "RT12345-M"),
    ]
    
    print("Testing Registration Number Strict Parsing...")
    for text, expected_new, expected_old in test_cases_reg:
        new_no, old_no = parse_registration_no_strict(text)
        if new_no == expected_new and old_no == expected_old:
            print(f"PASS: {text[:30]}...")
        else:
            print(f"FAIL: {text[:30]}... -> Got ({new_no}, {old_no}), Expected ({expected_new}, {expected_old})")

    test_cases_date = [
        ("Dated at KUALA LUMPUR this 02 MARCH 2017", "KUALA LUMPUR", "02 MARCH 2017"),
        ("Dated at JOHOR BAHRU this 15 JANUARY 2023", "JOHOR BAHRU", "15 JANUARY 2023"),
    ]
    
    print("\nTesting Dated At Strict Parsing...")
    for text, expected_place, expected_date in test_cases_date:
        place, date_str = parse_dated_at_strict(text)
        if place == expected_place and date_str == expected_date:
            print(f"PASS: {text[:30]}...")
        else:
            print(f"FAIL: {text[:30]}... -> Got ({place}, {date_str}), Expected ({expected_place}, {expected_date})")

    # Full extraction test
    print("\nTesting Full Extraction...")
    full_text = [
        "FORM D",
        "REGISTRATION OF BUSINESSES ACT 1956",
        "CERTIFICATE OF REGISTRATION",
        "REGISTRATION NO : 202003000123 (RT12345-M)",
        "This is to certify that the business carried on",
        "under the name",
        "MY TECH SOLUTIONS",
        "has this day been registered",
        "Dated at KUALA LUMPUR this 02 MARCH 2017"
    ]
    
    res = extract_form_d(full_text)
    if res["registration_number_new"] == "202003000123" and res["issue_place"] == "KUALA LUMPUR":
        print("PASS: Full Extraction")
    else:
        print(f"FAIL: Full Extraction -> {res}")

if __name__ == "__main__":
    test_strict_parsing()
