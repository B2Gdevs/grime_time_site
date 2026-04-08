# Page composer layout

Visual page composer UI lives under **`src/components/page-composer/`**:

| Path | Contents |
| --- | --- |
| `page-composer/PageComposer*.tsx` | Context, drawer shell, canvas entry, launcher, inline text, preview |
| `page-composer/canvas/` | On-page canvas chrome (sections, viewport, toolbar) |
| `page-composer/drawer/` | Floating drawer tabs, media, publish, block library |

**Admin impersonation** (`src/components/admin-impersonation/`) keeps operator tools, shared `adminPanelChrome`, and dialogs (`PhraseConfirmDialog`, etc.) that the composer imports but that are not composer-specific.
