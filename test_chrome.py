from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
options = webdriver.ChromeOptions()
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-extensions")

print("Installing ChromeDriver...")
svc = ChromeService(ChromeDriverManager().install())
print("Starting Chrome...")
driver = webdriver.Chrome(service=svc, options=options)
print("Success!")
driver.quit()
