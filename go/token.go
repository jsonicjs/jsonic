package jsonic

// Tin is a token identification number.
type Tin = int

// Standard token Tins - assigned in order matching the TypeScript implementation.
const (
	TinBD  Tin = 1  // #BD - BAD
	TinZZ  Tin = 2  // #ZZ - END
	TinUK  Tin = 3  // #UK - UNKNOWN
	TinAA  Tin = 4  // #AA - ANY
	TinSP  Tin = 5  // #SP - SPACE
	TinLN  Tin = 6  // #LN - LINE
	TinCM  Tin = 7  // #CM - COMMENT
	TinNR  Tin = 8  // #NR - NUMBER
	TinST  Tin = 9  // #ST - STRING
	TinTX  Tin = 10 // #TX - TEXT
	TinVL  Tin = 11 // #VL - VALUE (true, false, null)
	TinOB  Tin = 12 // #OB - Open Brace {
	TinCB  Tin = 13 // #CB - Close Brace }
	TinOS  Tin = 14 // #OS - Open Square [
	TinCS  Tin = 15 // #CS - Close Square ]
	TinCL  Tin = 16 // #CL - Colon :
	TinCA  Tin = 17 // #CA - Comma ,
	TinMAX Tin = 18 // Next available Tin
)

// Token set constants
var (
	// IGNORE tokens: space, line, comment
	TinSetIGNORE = map[Tin]bool{TinSP: true, TinLN: true, TinCM: true}
	// VAL tokens: text, number, string, value
	TinSetVAL = []Tin{TinTX, TinNR, TinST, TinVL}
	// KEY tokens: text, number, string, value (same as VAL)
	TinSetKEY = []Tin{TinTX, TinNR, TinST, TinVL}
)

// Point tracks position in source text.
type Point struct {
	Len int // Source length
	SI  int // String index (0-based)
	RI  int // Row index (1-based)
	CI  int // Column index (1-based)
}

// Token represents a lexical token.
type Token struct {
	Name string // Token name (#OB, #ST, etc.)
	Tin  Tin    // Token identification number
	Val  any    // Resolved value
	Src  string // Source text
	SI   int    // Start position
	RI   int    // Row
	CI   int    // Column
	Err  string // Error code
	Why  string // Tracing/reason
}

// IsNoToken returns true if this is a sentinel/empty token.
func (t *Token) IsNoToken() bool {
	return t.Tin == -1
}

// ResolveVal returns the token's value (or src for numbers used as keys).
func (t *Token) ResolveVal() any {
	return t.Val
}

// MakeToken creates a new Token.
func MakeToken(name string, tin Tin, val any, src string, pnt Point) *Token {
	return &Token{
		Name: name,
		Tin:  tin,
		Val:  val,
		Src:  src,
		SI:   pnt.SI,
		RI:   pnt.RI,
		CI:   pnt.CI,
	}
}

// NoToken is a sentinel token indicating "no token".
var NoToken = &Token{Name: "", Tin: -1, SI: -1, RI: -1, CI: -1}

// Fixed token source map: character -> Tin
var FixedTokens = map[string]Tin{
	"{": TinOB,
	"}": TinCB,
	"[": TinOS,
	"]": TinCS,
	":": TinCL,
	",": TinCA,
}
