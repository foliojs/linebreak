# The following break classes are handled by the pair table
exports.OP = OP = 0   # Opening punctuation
exports.CL = CL = 1   # Closing punctuation
exports.CP = CP = 2   # Closing parenthesis
exports.QU = QU = 3   # Ambiguous quotation
exports.GL = GL = 4   # Glue
exports.NS = NS = 5   # Non-starters
exports.EX = EX = 6   # Exclamation/Interrogation
exports.SY = SY = 7   # Symbols allowing break after
exports.IS = IS = 8   # Infix separator
exports.PR = PR = 9   # Prefix
exports.PO = PO = 10  # Postfix
exports.NU = NU = 11  # Numeric
exports.AL = AL = 12  # Alphabetic
exports.HL = HL = 13  # Hebrew Letter
exports.ID = ID = 14  # Ideographic
exports.IN = IN = 15  # Inseparable characters
exports.HY = HY = 16  # Hyphen
exports.BA = BA = 17  # Break after
exports.BB = BB = 18  # Break before
exports.B2 = B2 = 19  # Break on either side (but not pair)
exports.ZW = ZW = 20  # Zero-width space
exports.CM = CM = 21  # Combining marks
exports.WJ = WJ = 22  # Word joiner
exports.H2 = H2 = 23  # Hangul LV
exports.H3 = H3 = 24  # Hangul LVT
exports.JL = JL = 25  # Hangul L Jamo
exports.JV = JV = 26  # Hangul V Jamo
exports.JT = JT = 27  # Hangul T Jamo
exports.RI = RI = 28  # Regional Indicator

# The following break classes are not handled by the pair table
exports.AI = AI = 29  # Ambiguous (Alphabetic or Ideograph)
exports.BK = BK = 30  # Break (mandatory)
exports.CB = CB = 31  # Contingent break
exports.CJ = CJ = 32  # Conditional Japanese Starter
exports.CR = CR = 33  # Carriage return
exports.LF = LF = 34  # Line feed
exports.NL = NL = 35  # Next line
exports.SA = SA = 36  # South-East Asian
exports.SG = SG = 37  # Surrogates
exports.SP = SP = 38  # Space
exports.XX = XX = 39  # Unknown
