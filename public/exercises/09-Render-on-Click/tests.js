jest.dontMock('fs');

const fs = require('fs');
const path = require('path');
const {
    queryByText,
    // Tip: all queries are also exposed on an object
    // called "queries" which you could import here as well
    fireEvent,
    waitFor,
  } = require('@testing-library/dom')
  
const css = fs.readFileSync(path.resolve(__dirname, './styles.css'), 'utf8');
  
  // inject HTML into the document
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

let _document = document.cloneNode(true);

document.createElement = jest.fn((selector) => {
    return _document.createElement(selector);
});

//import js file after loading the HTML
require(path.resolve(__dirname, './index.js')) 

test('The <button> tag must exist', () => {
    // Get form elements by their label text.   
    // An error will be thrown if one cannot be found (accessibility FTW!)
    const btn = queryByText(document, 'Click me');
    expect(btn).toBeTruthy();
})

test('The <div> with "Hello World" must be added into the document after the <button> is clicked', async () => {
    // Get form elements by their label text.   
    // An error will be thrown if one cannot be found (accessibility FTW!)
    const btn = queryByText(document, 'Click me')
    fireEvent.click(btn)

    await waitFor(() => expect(queryByText(document, 'Hello World')).toBeTruthy())
})

test('The <div> with yellow background must be added into the document after the <button> is clicked', async () => {
    expect(queryByText(document, 'Hello World').style.background).toBe('yellow')
})

test('The createElement function should have been called once', () => {
    expect(document.createElement.mock.calls.length).toBe(1)
})
