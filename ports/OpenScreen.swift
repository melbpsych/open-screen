import Foundation

/// Drop-in scoring for an iOS or Mac app.
/// Bundle `dist/personality-5.json`. Show `headline` and `comparison`.
/// Do not present `percentile` as the result.
/// A tap reads one prebuilt row: `item.byRaw[raw - 1]`.

public struct OpenScreen {
    public let measure: [String: Any]

    public init(json: Data) throws {
        let object = try JSONSerialization.jsonObject(with: json)
        guard let measure = object as? [String: Any] else {
            throw OpenScreenError.notAnObject
        }
        guard let items = measure["items"] as? [[String: Any]],
              let first = items.first, first["byRaw"] != nil else {
            throw OpenScreenError.notCompiled
        }
        self.measure = measure
    }

    /// - Parameter raw: 1 (Disagree) through 5 (Agree), before any reverse key.
    public func score(itemId: String, raw: Int) -> [String: Any]? {
        guard (1...5).contains(raw),
              let items = measure["items"] as? [[String: Any]],
              let item = items.first(where: { $0["id"] as? String == itemId }),
              let rows = item["byRaw"] as? [[String: Any]], rows.count == 5 else { return nil }
        var row = rows[raw - 1]
        row["id"] = itemId
        row["status"] = "scored"
        row["construct"] = item["construct"] as Any
        row["followUp"] = item["followUp"] as Any
        return row
    }
}

public enum OpenScreenError: Error {
    case notAnObject
    case notCompiled
}
