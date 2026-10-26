"""Score a compiled Open Screen measure. No percentiles are recalculated.

Use the JSON in dist/. An answer is one array index:

    row = item["byRaw"][raw - 1]
"""


def score(measure, answers):
    items = measure["items"]
    if not items or "byRaw" not in items[0]:
        raise ValueError("This file has no byRaw table. Run: node core/compile.js")
    kind = measure["scoring"]
    if kind != "markers":
        raise ValueError(f"This Python reader scores marker measures. Got {kind}.")
    results = []
    for item in items:
        raw = answers.get(item["id"])
        if raw is None:
            results.append({"id": item["id"], "status": "unanswered"})
            continue
        # Python bool is an int subclass; a JSON boolean is not a response code.
        if type(raw) is not int or raw < 1 or raw > 5:
            raise ValueError(f"{item['id']} answer must be an integer from 1 to 5.")
        row = dict(item["byRaw"][raw - 1])
        row["id"] = item["id"]
        row["status"] = "scored"
        row["construct"] = item["construct"]
        row["followUp"] = item.get("followUp")
        results.append(row)
    return {
        "apiVersion": measure.get("apiVersion"),
        "kind": "markers",
        "id": measure["id"],
        "results": results,
    }
