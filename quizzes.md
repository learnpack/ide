# How to succesfully make quizzes for Learnpack

### Description

Quizzes are a great way to test the knowledge of the user. They are a great way to make the user think and to make the lesson more interactive. In LearnPack, the quizzes are rendered from plain markdown files using task list syntax.

### Rules

1. Each group of options should have a question title separated by an empty line from the options.
2. Each group of options must have an unique correct answer
3. Each option should be a checkbox indented by 3 to 6 spaces, this is important for the parsing from markdown to HTML. In general, depending of the editor you're using, you can simply `tab` to indent the options.
4. It must be an empty line between the question title and the options. This is important for the parsing from markdown to HTML.

##### First Example:

```md
1. Question number 1 (This is the title for the group of questions)
   <!-- Each group of options should have an empty line between the question title and the options -->

   - [ ] Incorrect option
   - [ ] Incorrect option
   - [x] Correct option (This is the correct answer)

2. Question number 2
   <!-- Each group of options should have an empty line between the question title and the options -->
   - [ ] Incorrect option
   - [x] Correct option
   - [ ] Incorrect option
```

##### Second Example:

```md
- Question number 1

  - [x] Correct option
  - [ ] Incorrect option
  - [ ] Incorrect option

- Question number 2

  - [ ] Incorrect option
  - [x] Correct option
  - [ ] Incorrect option
```

### Important 🖐🏻

If you use less than 3 spaces for indenting the options, **the quiz will not be recognized correctly**. Leave the empty line between the title of the question and the options also for proper parsing from markdown to HTML.

##### Each lesson must have different quizzes embedded in the same file. They just need to be separated by at least one element.

The following example of different quizzes in the same file:

```md
Welcome to the lesson! In this lesson, we will learn about the basics of HTML.

### First Quiz

1. What is the purpose of HTML?

   - [x] To create websites
   - [ ] To write code
   - [ ] To create a database

2. What is the purpose of CSS?

   - [ ] To create websites
   - [x] To style websites
   - [ ] To create a database
   - [ ] To create a mobile app

...Some other text, explanations, etc.

### Quiz 2

1. Question number 1

   - [ ] Option 1
   - [ ] Option 2
   - [ ] Option 3
```

### Notes

If you use an editor as VSCode, with `shift + alt + f` you can format the markdown file, and this will automatically fix the indentation and the empty lines.
