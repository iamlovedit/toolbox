export interface CaseVariants {
  camel: string;
  pascal: string;
  snake: string;
  kebab: string;
  upperSnake: string;
  dotCase: string;
  pathCase: string;
  titleCase: string;
  lowerCase: string;
  upperCase: string;
}

export function splitIntoWords(input: string): string[] {
  if (!input) {
    return [];
  }

  const withBoundaries = input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

  return withBoundaries
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

function capitalize(word: string): string {
  if (!word) {
    return word;
  }
  return word[0]!.toUpperCase() + word.slice(1);
}

export function computeCaseVariants(input: string): CaseVariants {
  const words = splitIntoWords(input);

  if (words.length === 0) {
    return {
      camel: "",
      pascal: "",
      snake: "",
      kebab: "",
      upperSnake: "",
      dotCase: "",
      pathCase: "",
      titleCase: "",
      lowerCase: "",
      upperCase: "",
    };
  }

  const camel = words
    .map((word, index) => (index === 0 ? word : capitalize(word)))
    .join("");
  const pascal = words.map(capitalize).join("");
  const snake = words.join("_");
  const kebab = words.join("-");
  const lower = words.join(" ");

  return {
    camel,
    pascal,
    snake,
    kebab,
    upperSnake: snake.toUpperCase(),
    dotCase: words.join("."),
    pathCase: words.join("/"),
    titleCase: words.map(capitalize).join(" "),
    lowerCase: lower,
    upperCase: lower.toUpperCase(),
  };
}
