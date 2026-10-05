// Prints entries from the macOS Dictionary app (the New Oxford American
// Dictionary), to compare Textura against Oxford. Output is Oxford's text:
// keep it out of the repo. Run with:
//   swiftc -O scripts/lookup-oxford.swift -o /tmp/lookup-oxford && /tmp/lookup-oxford nice set
import CoreServices
import Foundation
for word in CommandLine.arguments.dropFirst() {
  let range = CFRange(location: 0, length: word.utf16.count)
  if let def = DCSCopyTextDefinition(nil, word as CFString, range) {
    print("=== \(word)\n\(def.takeRetainedValue() as String)\n")
  } else { print("=== \(word): not found\n") }
}
