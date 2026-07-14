from datetime import datetime
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
EMAIL = "admin@praeto.local"
PASSWORD = "Admin1234!"


def screenshot(page, name):
    page.screenshot(path=f"e2e_screenshot_{name}.png", full_page=True)


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        # Login
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        screenshot(page, "01_login")
        page.locator('input[type="email"]').fill(EMAIL)
        page.locator('input[type="password"]').fill(PASSWORD)
        page.get_by_role("button", name="Sign in").click()
        page.wait_for_url("**/clients", timeout=10000)
        screenshot(page, "02_clients")

        # Create client
        page.goto(f"{BASE_URL}/clients/new")
        page.wait_for_load_state("networkidle")
        screenshot(page, "03_new_client")
        client_inputs = page.locator("input")
        client_inputs.nth(0).fill("E2E")
        client_inputs.nth(1).fill("Test")
        client_inputs.nth(2).fill("e2e.test@example.com")
        client_inputs.nth(3).fill("0821234567")
        client_inputs.nth(4).fill("7601011234087")
        page.locator('input[type="checkbox"]').check()
        page.get_by_role("button", name="Save Client").click()
        page.wait_for_url("**/clients", timeout=10000)
        page.wait_for_selector("text=E2E Test", timeout=10000)
        screenshot(page, "04_clients_after_create")

        # Create policy
        page.goto(f"{BASE_URL}/policies/new")
        page.wait_for_load_state("networkidle")
        screenshot(page, "05_new_policy")
        selects = page.locator("select")
        selects.nth(0).select_option(label="E2E Test")
        selects.nth(1).select_option("MOTOR")
        policy_inputs = page.locator("input")
        policy_number = f"POL-E2E-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        policy_inputs.nth(0).fill(policy_number)
        policy_inputs.nth(1).fill("2026-07-13")
        policy_inputs.nth(2).fill("2027-07-13")
        policy_inputs.nth(3).fill("250000")
        policy_inputs.nth(4).fill("1500")
        policy_inputs.nth(5).fill("1 Main Street")
        policy_inputs.nth(6).fill("Durban")
        policy_inputs.nth(7).fill("KwaZulu-Natal")
        policy_inputs.nth(8).fill("4000")
        page.get_by_role("button", name="Create Policy").click()
        page.wait_for_url("**/policies", timeout=10000)
        page.wait_for_selector(f"text={policy_number}", timeout=10000)
        screenshot(page, "06_policies_after_create")

        # Address change endorsement
        page.goto(f"{BASE_URL}/endorsements/address-change")
        page.wait_for_load_state("networkidle")
        screenshot(page, "07_address_change")
        addr_selects = page.locator("select")
        addr_selects.nth(0).select_option(label=f"E2E Test — {policy_number} — MOTOR")
        addr_inputs = page.locator("input")
        addr_inputs.nth(0).fill("2026-08-01")
        addr_inputs.nth(1).fill("2 New Avenue")
        addr_inputs.nth(4).fill("Cape Town")
        addr_inputs.nth(6).fill("8001")
        page.locator("textarea").nth(0).fill("Client relocated")
        page.get_by_role("button", name="Submit Endorsement").click()
        page.wait_for_url("**/policies", timeout=10000)
        screenshot(page, "08_policies_after_endorsement")

        print("E2E smoke test passed")
        browser.close()


if __name__ == "__main__":
    run()
