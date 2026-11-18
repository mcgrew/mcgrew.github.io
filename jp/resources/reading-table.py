
import json
from re import sub
from collections import defaultdict

readings = defaultdict(list)


def katakana(text):
    return sub(r'[\u3041-\u3096]', lambda m: chr(ord(m.group(0)) + 0x60), text)


def hiragana(text):
    # Matches standard katakana from ァ (U+30A1) to ヶ (U+30F6)
    return sub(r'[\u30A1-\u30F6]', lambda m: chr(ord(m.group(0)) - 0x60), text)


def kanji_sort(k):
    return kanji[k]['freq'] or 10000 + ord(k[0])


with open('kanji.json', 'r') as k:
    kanji = json.load(k)

for k, info in kanji.items():
    if info['readings_on']:
        readings[info['readings_on'][0]].append(k)


print('''<!DOCTYPE html>
<html>
 <head>
  <title>Onyomi Reading Table</title>
  <meta http-equiv="content-type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <link href="../resources/table.css" rel="stylesheet">
 </head>
 <body>
 <div>
  <table>
   <thead>
    <tr><th>Reading</th><th>Kanji</th></tr>
   </thead><tbody>''')  # noqa: E501

for r, k in sorted(readings.items(), key=lambda x: -len(x[1])):
    ordered = sorted(k, key=kanji_sort)
    print(f'<tr><td>{katakana(r)}</td><td>{' '.join(ordered)}</td></tr>')


print('  </tbody></table></div>\n </body>\n</html>')
