LineBreaker = require './linebreaker'

str = "Thi\ns is a test sentence, and it's pretty cool!"
# str = "是一个内容自由、任何人都能参与、并有多种语言的百科全书协作计划。我们的目标是建立一个完整、准确和中立的百科全书。"
str = "при возникновении любых непонятных ситуаций обнимайте домашнее животное"
breaker = new LineBreaker str
last = 0
while bk = breaker.nextBreak()
    console.log str.slice(last, bk.position)
    last = bk.position