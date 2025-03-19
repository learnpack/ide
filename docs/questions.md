# How to write open questions in a LearnPack lesson

An open is a question that the user can answer with a text. LearnPack will automatically check if the answer is correct using an LLM.  

## How to write an open question

To write an open question, you need to use a markdown code block with the language set to `question` and add a metadata property eval in the metadata section of the code block. For example:


### What is console.log in your own words?
```question eval="The user needs to write using its own words what is console.log"
```

### Notes

The user won't see the eval property, it is only used by LearnPack to evaluate the question. You should add the question in a way that is easy for the user to understand before adding question code block. 
