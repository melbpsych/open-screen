import json
from pathlib import Path

from open_screen import score

measure = json.loads((Path(__file__).resolve().parents[1] / "dist" / "personality-5.json").read_text())
result = score(measure, {"EXT7": 4, "EST1": 5, "AGR1": 1, "CSN6": 2, "OPN8": 3})
by_id = {row["id"]: row for row in result["results"]}

assert result["kind"] == "markers"
assert "total" not in result
assert by_id["EXT7"]["headline"] == "High"
assert by_id["EXT7"]["comparison"]["kind"] == "distribution"
assert by_id["EXT7"]["comparison"]["bins"][3]["selected"] is True
assert "percentile" not in by_id["EXT7"]["headline"].lower()
assert by_id["EST1"]["keyed"] == 1
assert by_id["EST1"]["headline"] == "Low"
assert by_id["EST1"]["band"] == "low"
assert by_id["AGR1"]["keyed"] == 5
assert by_id["AGR1"]["common"] is True
assert by_id["AGR1"]["headline"] == "High"
assert by_id["CSN6"]["headline"] == "High"
assert by_id["OPN8"]["headline"] == "Middle"
for invalid in [True, False, "2", 1.5, 0, 6]:
    try:
        score(measure, {"EXT7": invalid})
    except ValueError:
        pass
    else:
        raise AssertionError(f"Invalid response accepted: {invalid!r}")
print("python score ok")
