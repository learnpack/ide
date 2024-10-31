import io
import sys
sys.stdout = buffer = io.StringIO()
# from app import my_function
import pytest
import os
import app
import re
path = os.path.dirname(os.path.abspath(__file__))+'/app.py'

@pytest.mark.it('You should create a variable named variables_are_cool')
def test_variable_exists():
    try:
        from app import variables_are_cool
    except ImportError:
        raise ImportError("The variable 'variables_are_cool' should exist on app.py")

@pytest.mark.it('The value of variables_are_cool should be 2345 * 7323')
def test_use_variable_name():
    result = app.variables_are_cool == 17172435
    assert result == True

@pytest.mark.it('Print on the console the value of variables_are_cool')
def test_for_file_output(capsys):
    captured = buffer.getvalue()
    assert '17172435\n' in captured

@pytest.mark.it('Print on the console the variables_are_cool variable')
def test_for_print():
    with open(path, 'r') as content_file:
        content = content_file.read()
        # makes sure we are calling print function with a variable and not the hard coded value
        regex = re.compile(r"print\s*\(\s*variables_are_cool\s*\)")
        assert bool(regex.search(content)) == True

@pytest.mark.it('You should not hardcode the result')
def test_for_print():
    with open(path, 'r') as content_file:
        content = content_file.read()
        # makes sure we are calling print function with a variable and not the hard coded value
        assert str(17172435) not in content
