import argparse
import csv
import os
import time
from pathlib import Path

import requests

OUTPUT = Path("output/REAL")
METADATA = Path("output/metadata_real.csv")

SEARCHES = {
    "world_cup": [
        "FIFA World Cup fans",
        "World Cup stadium",
        "football supporters",
        "international football match",
    ],
    "lebron_decision": [
        "LeBron James",
        "LeBron James basketball",
        "LeBron James press conference",
        "LeBron James Miami Heat",
    ],
    "nyc_core": [
        "New York City street",
        "NYC subway",
        "Manhattan rain",
        "yellow taxi New York",
        "Brooklyn nightlife",
    ],
    "brain_rot": [
        "weird costume",
        "chaotic gaming room",
        "internet cafe",
        "people staring at phones",
        "strange mascot",
    ],
}


def save_metadata(row):
    METADATA.parent.mkdir(parents=True, exist_ok=True)
    exists = METADATA.exists()

    with METADATA.open("a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=row.keys())
        if not exists:
            writer.writeheader()
        writer.writerow(row)


def download_file(url, path):
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    path.write_bytes(response.content)


def wikimedia(category, count):
    folder = OUTPUT / category
    folder.mkdir(parents=True, exist_ok=True)

    downloaded = 0

    for search in SEARCHES[category]:
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": search,
            "gsrnamespace": 6,
            "gsrlimit": 50,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "format": "json",
        }

        response = requests.get(
            "https://commons.wikimedia.org/w/api.php",
            params=params,
            headers={
                "User-Agent": "RealOrFakeGame/1.0 contact@example.com"
            },
            timeout=60,
        )
        response.raise_for_status()

        pages = response.json().get("query", {}).get("pages", {})

        for page in pages.values():
            if downloaded >= count:
                return

            info = page.get("imageinfo", [{}])[0]
            url = info.get("url")

            if not url:
                continue

            extension = url.split("?")[0].split(".")[-1].lower()

            if extension not in {"jpg", "jpeg", "png", "webp"}:
                continue

            downloaded += 1
            filename = f"{category}_real_{downloaded:04d}.{extension}"
            path = folder / filename

            try:
                download_file(url, path)
            except requests.RequestException:
                downloaded -= 1
                continue

            metadata = info.get("extmetadata", {})

            save_metadata({
                "id": f"{category}_real_{downloaded:04d}",
                "category": category,
                "label": "real",
                "source": "Wikimedia Commons",
                "source_url": info.get("descriptionurl", ""),
                "image_url": url,
                "photographer": metadata.get("Artist", {}).get("value", ""),
                "license": metadata.get("LicenseShortName", {}).get("value", ""),
                "filename": str(path),
            })

            print(f"[{downloaded}/{count}] {filename}")
            time.sleep(0.3)


def pexels(category, count):
    api_key = os.environ["PEXELS_API_KEY"]
    folder = OUTPUT / category
    folder.mkdir(parents=True, exist_ok=True)

    downloaded = 0

    for search in SEARCHES[category]:
        response = requests.get(
            "https://api.pexels.com/v1/search",
            headers={"Authorization": api_key},
            params={
                "query": search,
                "per_page": 80,
                "orientation": "portrait",
            },
            timeout=60,
        )
        response.raise_for_status()

        for photo in response.json().get("photos", []):
            if downloaded >= count:
                return

            downloaded += 1
            filename = f"{category}_real_{downloaded:04d}.jpg"
            path = folder / filename
            url = photo["src"]["large2x"]

            try:
                download_file(url, path)
            except requests.RequestException:
                downloaded -= 1
                continue

            save_metadata({
                "id": f"{category}_real_{downloaded:04d}",
                "category": category,
                "label": "real",
                "source": "Pexels",
                "source_url": photo["url"],
                "image_url": url,
                "photographer": photo["photographer"],
                "license": "Pexels License",
                "filename": str(path),
            })

            print(f"[{downloaded}/{count}] {filename}")
            time.sleep(0.3)


def flickr(category, count):
    api_key = os.environ["FLICKR_API_KEY"]
    folder = OUTPUT / category
    folder.mkdir(parents=True, exist_ok=True)

    downloaded = 0

    for search in SEARCHES[category]:
        params = {
            "method": "flickr.photos.search",
            "api_key": api_key,
            "text": search,
            "license": "4,5,6,9,10",
            "safe_search": 1,
            "content_type": 1,
            "media": "photos",
            "extras": "url_l,url_c,license,owner_name",
            "per_page": 100,
            "format": "json",
            "nojsoncallback": 1,
        }

        response = requests.get(
            "https://www.flickr.com/services/rest/",
            params=params,
            timeout=60,
        )
        response.raise_for_status()

        for photo in response.json().get("photos", {}).get("photo", []):
            if downloaded >= count:
                return

            url = photo.get("url_l") or photo.get("url_c")

            if not url:
                continue

            downloaded += 1
            filename = f"{category}_real_{downloaded:04d}.jpg"
            path = folder / filename

            try:
                download_file(url, path)
            except requests.RequestException:
                downloaded -= 1
                continue

            source_url = (
                f"https://www.flickr.com/photos/"
                f"{photo['owner']}/{photo['id']}"
            )

            save_metadata({
                "id": f"{category}_real_{downloaded:04d}",
                "category": category,
                "label": "real",
                "source": "Flickr",
                "source_url": source_url,
                "image_url": url,
                "photographer": photo.get("ownername", ""),
                "license": photo.get("license", ""),
                "filename": str(path),
            })

            print(f"[{downloaded}/{count}] {filename}")
            time.sleep(0.3)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--category",
        required=True,
        choices=SEARCHES.keys(),
    )
    parser.add_argument("--count", type=int, default=100)
    args = parser.parse_args()

    if args.category in {"world_cup", "lebron_decision"}:
        wikimedia(args.category, args.count)
    elif args.category == "nyc_core":
        pexels(args.category, args.count)
    else:
        flickr(args.category, args.count)


if __name__ == "__main__":
    main()
