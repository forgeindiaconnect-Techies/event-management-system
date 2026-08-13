import os
import re

for root, _, files in os.walk("event-booking-app/src/app"):
    for file in files:
        if file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if "=> router.back()" in content:
                content = re.sub(r"=> router\.back\(\)", "=> { if (router.canGoBack()) { router.back(); } else { router.replace('/home'); } }", content)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                print("Updated " + path)
