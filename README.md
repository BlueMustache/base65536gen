# base65536gen

This module's purpose is to generate 256 + 1 blocks of 256 Unicode code points suitable for use in [the `base65536` project](https://github.com/ferno/base65536).

In an ideal world, this program should only ever need to be executed once. The results are then transplanted into the `base65536` project for usage there.

## About

[Base64](https://en.wikipedia.org/wiki/Base64) is used to encode arbitrary binary data as "plain" text using a small, extremely safe repertoire of 64 (well, 65) characters. Base64 remains highly suitable to text systems where the range of characters available is very small -- i.e., anything still constrained to plain ASCII. Base64 encodes 6 bits, or 3/4 of an octet, per character.

However, now that Unicode rules the world, the range of characters which can be considered "safe" in this way is significantly larger in many situations. Base65536 applies the same basic principle to a carefully-chosen repertoire of 65,536 (well, 65,792) Unicode code points, encoding 16 bits, or 2 octets, per character.

The purpose of `base65536gen` is to generate these safe characters.

## What makes a character "safe"?

Not every Unicode character is "safe" for this purpose, otherwise this whole project would be a one-liner.

* No nulls.
* No [whitespace characters](https://en.wikipedia.org/wiki/Whitespace_character#Unicode), no unprintable characters. If a Base65536 text contains whitespace, it may be eliminated or corrupted when the text is passed through, for example, an XML document. Also, a person trying to select that text may accidentally miss the whitespace, particularly if the whitespace is leading or trailing.
* No [control characters](https://en.wikipedia.org/wiki/Unicode_control_characters). These won't render properly in most situations. In fact, any characters which have any chance of being replaced with U+FFFD REPLACEMENT CHARACTER are undesirable here.
* No non-characters or unassigned code points. This constrains us to around 120,000 code points from the full 1,114,112-code point range, at the time of writing.
* No surrogate pairs.
* No [combining characters](https://en.wikipedia.org/wiki/Combining_character), including diacritics. This is hazardous if the encoding allows a combining character to appear first in the text. It's simpler to discard them altogether.
* No delimiters, punctuation or quotes. This means Base65536 can itself be safely put inside delimiters and quotes if need be, without ambiguity.
* In fact, we should just constrain our options to characters from "safe" [General Categories](https://en.wikipedia.org/wiki/Unicode_character_property#General_Category) of Unicode, if possible. It turns out that category "Lo" ("Letter, other") all by itself is plenty.
* Characters must survive all forms of [normalization](https://en.wikipedia.org/wiki/Unicode_equivalence#Normalization).

### Normalization

This final point is the most difficult to satisfy. Unicode has four "normal forms", NFD, NFC, NFKD and NFKC. Applying any of these four normalization processes to a Unicode string can cause the code point sequence to alter, which for our purposes constitutes data corruption. As a pertinent example, [Twitter applies NFC normalization to all its Tweets](https://dev.twitter.com/overview/api/counting-characters). It would be great if short Base65536 strings could survive passing through a Tweet.

Although a very large number of assigned Unicode code points *are* actually safe in this way, proving that this is true and finding those code points was surprisingly tricky. [Unicode Standard Annex #15, UNICODE NORMALIZATION FORMS](http://unicode.org/reports/tr15/) gives more information about this, including the follow incredibly valuable facts:

* [A string normalized under one version of Unicode remains normalized under future versions, provided it uses no unassigned code points](http://unicode.org/reports/tr15/#Stability_of_Normalized_Forms). So if we get this right once, we don't need to worry about future changes to Unicode making it wrong again.
* [Normalization Forms are not closed under string concatenation](http://unicode.org/reports/tr15/#Concatenation). If more text is put at the beginning or the end of a Base65536 text, it could not only change but *corrupt* the binary. However, Base64 has this same issue. As long as the text is protected by delimiters/brackets/whitespace, it should be fine.
* [Substrings of normalized strings are still normalized](http://unicode.org/reports/tr15/#Concatenation), which means a "safe" Base65536 text can be broken into several smaller texts without risk.
* [Many code points are *stable*](http://unicode.org/reports/tr15/#Stable_Code_Points) with respect to a particular Normalization Form.

### What makes a code point stable?

Within the Unicode standard, every single code point has a large number of properties associated with it. Information about these properties is found in the [Unicode Character Database](http://unicode.org/ucd) ([documentation](http://unicode.org/reports/tr44/#Canonical_Combining_Class)). The machine-readable data itself is [here](http://www.unicode.org/Public/UCD/latest/).

One of these properties is [`Canonical_Combining_Class`](http://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedCombiningClass.txt), ([documentation](http://unicode.org/reports/tr44/#Canonical_Combining_Class)), which explains how, if at all, the character combines with other characters. The majority of characters have a default canonical combining class of `Not_Reordered` (0).

Four other properties [`NFD_Quick_Check`](http://unicode.org/reports/tr44/#NFD_Quick_Check), [`NFKD_Quick_Check`](http://unicode.org/reports/tr44/#NFKD_Quick_Check), [`NFC_Quick_Check`](http://unicode.org/reports/tr44/#NFC_Quick_Check) and [`NFKC_Quick_Check`](http://unicode.org/reports/tr44/#NFKC_Quick_Check) ([data](http://www.unicode.org/Public/UCD/latest/ucd/DerivedNormalizationProps.txt)), which are the "Quick Check" properties for each of the Normalization Forms. A value of "Yes" indicates that the character is unchanged by that Normalization Form.

[As we see here](http://unicode.org/reports/tr15/#Stable_Code_Points), a code point is considered stable under a Normalization Form if it has a canonical combining class of 0 and a Quick Check value of "Yes". So all we need to do is parse this data and analyse it to get a full list of the safe code points.

## What don't we care about?

* Byte length. Twitter, the main use case here, measures code point length.
* Visible space taken up by the data on the screen. Judicious use of Zalgo-esque diacritics could serve to decrease the physical space the text takes up on the screen, to the extent that an arbitrary amount of data could be crammed into a single character. However, this comes at the expense of code point length, due to the relative scarcity of combining diacritics. It would also make the encoding more complex, and very difficult to harden against normalization.
* Humans trying to write the data out by hand on paper, then input the data again. Restricting ourselves only to the characters which would survive a round trip through someone's handwriting, even Base64 would need to be cut down severely due to the visual similarities between, for example, "l", "L" and "1", "n", "u" and "r" and "o", "O" and "0".
* Code points occupying sequential blocks, beyond what is practical. It's highly unlikely that we'll find a 65,792-code point block which suits our needs, but smaller blocks of 256 code points would be desirable.
* Concatenating two Base65536 texts together to make a third. This doesn't work for Base64 either.

## How does `base65536gen` work?

Basically it pulls the data from UCD (well, a local copy of it) and then assembles it into a collection of 256 + 1 blocks of 256 contiguous safe code points.

The extra block is for cases where the binary data runs for an odd number of bytes. A single code point encodes two bytes, and there's no way for it to signal that it only encodes one byte without these extra code points.

## License

MIT