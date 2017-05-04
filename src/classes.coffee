# The following break classes are handled by the pair table
OP = 0   # Opening punctuation
`export {OP}`
CL = 1   # Closing punctuation
`export {CL}`
CP = 2   # Closing parenthesis
`export {CP}`
QU = 3   # Ambiguous quotation
`export {QU}`
GL = 4   # Glue
`export {GL}`
NS = 5   # Non-starters
`export {NS}`
EX = 6   # Exclamation/Interrogation
`export {EX}`
SY = 7   # Symbols allowing break after
`export {SY}`
IS = 8   # Infix separator
`export {IS}`
PR = 9   # Prefix
`export {PR}`
PO = 10  # Postfix
`export {PO}`
NU = 11  # Numeric
`export {NU}`
AL = 12  # Alphabetic
`export {AL}`
HL = 13  # Hebrew Letter
`export {HL}`
ID = 14  # Ideographic
`export {ID}`
IN = 15  # Inseparable characters
`export {IN}`
HY = 16  # Hyphen
`export {HY}`
BA = 17  # Break after
`export {BA}`
BB = 18  # Break before
`export {BB}`
B2 = 19  # Break on either side (but not pair)
`export {B2}`
ZW = 20  # Zero-width space
`export {ZW}`
CM = 21  # Combining marks
`export {CM}`
WJ = 22  # Word joiner
`export {WJ}`
H2 = 23  # Hangul LV
`export {H2}`
H3 = 24  # Hangul LVT
`export {H3}`
JL = 25  # Hangul L Jamo
`export {JL}`
JV = 26  # Hangul V Jamo
`export {JV}`
JT = 27  # Hangul T Jamo
`export {JT}`
RI = 28  # Regional Indicator
`export {RI}`

# The following break classes are not handled by the pair table
AI = 29  # Ambiguous (Alphabetic or Ideograph)
`export {AI}`
BK = 30  # Break (mandatory)
`export {BK}`
CB = 31  # Contingent break
`export {CB}`
CJ = 32  # Conditional Japanese Starter
`export {CJ}`
CR = 33  # Carriage return
`export {CR}`
LF = 34  # Line feed
`export {LF}`
NL = 35  # Next line
`export {NL}`
SA = 36  # South-East Asian
`export {SA}`
SG = 37  # Surrogates
`export {SG}`
SP = 38  # Space
`export {SP}`
XX = 39  # Unknown
`export {XX}`
