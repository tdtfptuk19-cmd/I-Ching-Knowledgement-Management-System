# Project: Trợ lý Dịch sư (Process Layer KMS301)

## Architecture
- **Layer**: Process Layer of KMS301 (KinhDich_KB).
- **Paradigm**: Modular Monolith / Clean Architecture.
- **Data Flow**:
  1. Client sends request to `POST /api/v1/divination/interpret` with `case_id` or `divination_payload`, `user_question`, `user_level`.
  2. Router validates parameters (`user_level` validity, `user_question <= 500` chars), looks up `case_id` or verifies `ALLOW_CLIENT_PAYLOAD` in dev/test, and checks in-memory cache.
  3. Preprocessing engine (`build_facts`) flattens and sanitizes payload into immutable `Facts` dataclass (extracting Thể/Dụng via `dung_side`, isolating 5 core classic texts, extracting `poem_texts`, building `valid_citations: frozenset[str]` with 8 valid prefixes, isolating `leak_strings`, wrapping `user_question` in triple-quotes).
  4. Dynamic prompt loader loads `dich_su_system.md` (Appendix A verbatim) from external configuration path.
  5. `DichSuService` orchestrates prompt assembly, invokes `LLMClient` (`FakeLLMClient` for tests/offline, `AnthropicClient` via `httpx` for runtime) with max 2 retries on connection error and a 45s total deadline.
  6. `post_validation` executes all 9 guardrail checks. On violation, triggers 1 LLM retry with detailed violation report. If still violating or on error/timeout/empty response, invokes `build_fallback_interpretation(facts)`.
  7. Fallback generator builds a 3-section markdown text that 100% passes all 9 post-validation criteria without leaking disclaimer text.
  8. Router formats and returns `DichSuResponse` JSON schema with `markdown_text`, `citations`, `is_fallback`, `validation_report`, `disclaimer`, `prompt_version`, `model`, `attempts`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | F1: External System Prompt | `process_layer/app/prompts/dich_su_system.md` verbatim from Appendix A, with dynamic loader | M1 | R1, AC-01 |
| 2 | F2: Immutable Facts Dataclass | Dataclass `Facts(user_message, valid_citations, polarity_label, moving_line, poem_texts, leak_strings, rules_empty, topic_fallback, hao_tu_is_hung)` | M2 | R2, AC-03 |
| 3 | F3: `build_facts` Preprocessor | Flattens payload, determines Thể/Dụng via `dung_side`, filters 5 classic texts, extracts `poem_texts`, sanitizes leak strings, formats user message per Appendix B | M2 | R2, AC-04..AC-07 |
| 4 | F4: Valid Citation Tag Grammar | Generates 8-prefix citation tag grammar into `valid_citations: frozenset[str]` | M2 | R2, AC-07 |
| 5 | F5: LLMClient Protocol & Implementations | Protocol `generate(system, user, temp, max_tokens, timeout) -> tuple[str, str]`, `FakeLLMClient` with scripted responses, `AnthropicClient` via httpx | M3 | R3, AC-08, AC-16 |
| 6 | F6: 9 Post-Validation Checks | Structural H2s, label lock, regex boundaries for forbidden words, citation grammar & density, G5 vigilance check, G9 poem & leak check, standard phrases count, max_tokens stop reason | M3 | R3, AC-08..AC-11 |
| 7 | F7: Deterministic Fallback Generator | Builds fallback markdown text meeting 100% of post-validation criteria without leaking disclaimer | M3 | R3, AC-12, AC-13 |
| 8 | F8: DichSuService Orchestration | Retry logic (2x), 45s deadline, single repair attempt on validation failure, automatic fallback trigger | M3 | R3, AC-08, AC-12 |
| 9 | F9: Interpretation API Endpoint | `POST /api/v1/divination/interpret` with case_id lookup, payload gate (`ALLOW_CLIENT_PAYLOAD`), validation (422), caching | M4 | R4, AC-14, AC-15 |
| 10 | F10: Windows & Vietnamese Normalization | UTF-8 no BOM, `pathlib.Path`, `unicodedata.normalize('NFC')` on all text and citations | M5 | R5 |
| 11 | F11: Preservation of Core Engine Baseline | Strict freeze on `CastingEngine`, `RuleEngine`, `SynthesisEngine`; 100% baseline tests pass | M5 | R6, AC-02 |
| 12 | F12: Test Fixtures & Comprehensive Pytest Suite | 7 fixtures (`golden_phe_hap_real.json`, `llm_ok.md`, `llm_bad_*.md`) and 7 test cases in `test_dich_su_assistant.py` | M5 | R7, AC-16, AC-17 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: System Prompt Externalization | F1 (`dich_su_system.md` & prompt loader) | none | DONE |
| 2 | M2: Input Preprocessing & Facts Dataclass | F2, F3, F4 (`Facts`, `build_facts`, citations, leak strings) | M1 | DONE |
| 3 | M3: LLM Service, Post-Validation & Fallback | F5, F6, F7, F8 (`LLMClient`, `post_validation`, fallback, `DichSuService`) | M2 | DONE |
| 4 | M4: FastAPI Endpoint & Caching | F9 (`POST /api/v1/divination/interpret`, schemas, caching, gate) | M3 | DONE |
| 5 | M5: Normalization & Comprehensive Test Suite | F10, F11, F12 (fixtures, test suite, baseline verification, Golden Case) | M4 | DONE |

## Interface Contracts
### `Facts` Dataclass & `build_facts` Contract
- File: `process_layer/app/engines/dich_su_facts.py`
- Signature:
  ```python
  @dataclass(frozen=True)
  class Facts:
      user_message: str
      valid_citations: frozenset[str]
      polarity_label: str
      moving_line: int
      poem_texts: tuple[str, ...]
      leak_strings: tuple[str, ...]
      rules_empty: bool
      topic_fallback: bool
      hao_tu_is_hung: bool

  def build_facts(
      divination_payload: dict,
      user_question: Optional[str] = None,
      user_level: Optional[str] = None
  ) -> Facts: ...
  ```

### `LLMClient` Protocol & Validation Contract
- Files: `process_layer/app/engines/llm_client.py`, `process_layer/app/engines/dich_su_validator.py`
- Signatures:
  ```python
  class LLMClient(Protocol):
      def generate(
          self,
          system: str,
          user: str,
          temperature: float = 0.3,
          max_tokens: int = 2000,
          timeout: float = 30.0,
      ) -> tuple[str, str]: ...

  def post_validation(
      markdown_text: str,
      facts: Facts,
      stop_reason: str = "end_turn"
  ) -> tuple[bool, list[dict]]: ...
  ```

### `DichSuService` Contract
- File: `process_layer/app/engines/dich_su_service.py`
- Signature:
  ```python
  class DichSuService:
      def __init__(self, client: Optional[LLMClient] = None, prompt_path: Optional[Path] = None): ...
      def interpret(
          self,
          payload: dict,
          user_question: Optional[str] = None,
          user_level: Optional[str] = None,
      ) -> dict: ...
  ```

### FastAPI Endpoint Contract
- Path: `POST /api/v1/divination/interpret`
- Request Schema (`InterpretRequest` in `process_layer/app/schemas/dich_su.py`):
  `case_id: Optional[str]`, `divination_payload: Optional[dict]`, `user_question: Optional[str]`, `user_level: Optional[str]`
- Response Schema (`InterpretResponse` in `process_layer/app/schemas/dich_su.py`):
  `markdown_text: str`, `citations: list[str]`, `is_fallback: bool`, `validation_report: dict`, `disclaimer: str`, `prompt_version: str`, `model: str`, `attempts: int`

## Code Layout
- Exclusive File Boundaries:
  - M1: `process_layer/app/prompts/dich_su_system.md`, `process_layer/app/core/prompts.py`
  - M2: `process_layer/app/engines/dich_su_facts.py`
  - M3: `process_layer/app/engines/llm_client.py`, `process_layer/app/engines/dich_su_validator.py`, `process_layer/app/engines/dich_su_service.py`
  - M4: `process_layer/app/schemas/dich_su.py`, `process_layer/app/api/divination.py`
  - M5: `process_layer/tests/fixtures/*`, `process_layer/tests/test_dich_su_assistant.py`
- FROZEN FILES (DO NOT MODIFY):
  - `process_layer/app/engines/casting_engine.py`
  - `process_layer/app/engines/rule_engine.py`
  - `process_layer/app/engines/synthesis_engine.py`
  - `process_layer/app/engines/lunar_calendar.py`
  - Existing tests in `process_layer/tests/test_*.py` (must remain untouched and pass 100%)
