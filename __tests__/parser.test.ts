import { parseAwesomeList, searchItems } from "@/lib/parser";
import type { AwesomeCatalog } from "@/types";

describe("parseAwesomeList", () => {
  const sampleMarkdown = `
## Development Tools

A curated list of awesome development tools.

### Code Editors

- [VSCode](https://code.visualstudio.com/) - Free and open source code editor
- [Sublime Text](https://www.sublimetext.com/) - A sophisticated text editor for code

### Version Control

- [Git](https://git-scm.com/) - Distributed version control system
- [GitHub Desktop](https://desktop.github.com/) - GitHub Desktop client

## Learning Resources

### Tutorials

- [FreeCodeCamp](https://www.freecodecamp.org/) - Learn to code for free
- [MDN Web Docs](https://developer.mozilla.org/) - Resources for developers, by developers
`;

  let catalog: AwesomeCatalog;
  let parseAwesomeList: any;

  beforeAll(async () => {
    const parser = await import("@/lib/parser");
    parseAwesomeList = parser.parseAwesomeList;
    catalog = await parseAwesomeList(sampleMarkdown);
  });

  test("parses top-level categories correctly", () => {
    expect(catalog.tree).toHaveLength(2);
    expect(catalog.tree[0].title).toBe("Development Tools");
    expect(catalog.tree[1].title).toBe("Learning Resources");
  });

  test("generates correct slugs for categories", () => {
    expect(catalog.tree[0].slug).toBe("development-tools");
    expect(catalog.tree[0].children[0].slug).toBe("development-tools-code-editors");
  });

  test("parses subcategories correctly", () => {
    const devTools = catalog.tree[0];
    expect(devTools.children).toHaveLength(2);
    expect(devTools.children[0].title).toBe("Code Editors");
    expect(devTools.children[1].title).toBe("Version Control");
  });

  test("parses items with descriptions", () => {
    const codeEditors = catalog.tree[0].children[0];
    expect(codeEditors.items).toHaveLength(2);
    expect(codeEditors.items[0]).toEqual({
      title: "VSCode",
      url: "https://code.visualstudio.com/",
      description: "Free and open source code editor",
      category: "Development Tools",
      subcategory: "Code Editors",
    });
  });

  test("maintains a flat list of all items", () => {
    expect(catalog.list).toHaveLength(6);
    expect(catalog.meta.totalItems).toBe(6);
  });

  test("includes version and metadata", () => {
    expect(catalog.meta.version).toBe(2);
    expect(catalog.meta.updatedAt).toBeDefined();
  });
});

describe("searchItems", () => {
  let catalog: AwesomeCatalog;
  let searchItems: any;
  let parseAwesomeList: any;

  beforeAll(async () => {
    const parser = await import("@/lib/parser");
    parseAwesomeList = parser.parseAwesomeList;
    searchItems = parser.searchItems;
    catalog = await parseAwesomeList(`
## Tools
### Editors
- [VSCode](https://code.visualstudio.com/) - Visual Studio Code editor
- [Sublime](https://www.sublimetext.com/) - Fast text editor
### Git Tools
- [GitHub](https://github.com) - Code hosting platform
`);
  });

  test("finds items by title", () => {
    const results = searchItems(catalog, "vscode");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("VSCode");
  });

  test("finds items by description", () => {
    const results = searchItems(catalog, "fast text");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Sublime");
  });

  test("finds items by category", () => {
    const results = searchItems(catalog, "git");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("GitHub");
  });

  test("returns empty array for no matches", () => {
    const results = searchItems(catalog, "nonexistent");
    expect(results).toHaveLength(0);
  });

  test("respects the limit parameter", () => {
    const results = searchItems(catalog, "editor", 1);
    expect(results).toHaveLength(1);
  });

  test("matches all search terms", () => {
    const results = searchItems(catalog, "code editor");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("VSCode");
  });
});