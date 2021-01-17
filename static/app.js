const Wrapper = styled.div`
  color: #232323;
  border-top: 4px solid #fcb431;
  max-width: 940px;
  flex-grow: 1;
  margin: 2rem;
  background: #fff;
  padding: 2rem;
  font-size: 1em;
  box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
  font-size: 1em;
  line-height: 1.4;

  @media(max-width: 500px) {
    margin: 0;
  }
`

const Title = styled.h1`
  font-size: 1.5em;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  @media(max-width: 500px) {
    justify-content: center;
  }
`

const AppName = styled.span`
  background: #2085bc;
  font-weight: 200;
  color: #fff;
  padding: 0.5rem 1rem;
  line-height: 1;
  border-radius: 2rem;
  margin-left: auto;

  @media(max-width: 500px) {
    margin: 1rem 0 0;
  }
`

const LinkHome = styled.a`
  background-image: url('static/ai2-logo-header.png');
  background-size: 360px 71px;
  backround-repeat: no-repeat;
  width: 360px;
  height: 71px;
  display: block;
  margin: 0 1rem 0 0;

  @media(max-width: 500px) {
    background-image: url('static/ai2-logo-header-crop.png');
    background-size: 89px 71px;
    width: 89px;
    height: 71px;
  }
`

const Intro = styled.div`
  margin: 2em 0;

  @media(max-width: 500px) {
    font-size: 0.8em;
  }
`

const TextInputWrapper = styled.div`
  position: relative;
`

const Loading = styled.div`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.8em;
  color: #8c9296;
`

const Error = styled(Loading)`
  color: red;
`

const LoadingText = styled.div`
  padding-left: 0.5rem;
`

const InputOutput = styled.div`
  display: flex;

  @media(max-width: 500px) {
    display: block;
  }
`

const InputOutputColumn = styled.div`
  flex: 1 1 50%;

  :first-child {
    padding-right: 1rem;
  }

  :last-child {
    padding-left: 1rem;
  }

  @media(max-width: 500px) {
    :first-child,
    :last-child {
      padding: 0;
    }

    :first-child {
      padding: 0 0 1rem;
    }
  }
`

const TextInput = styled.textarea`
  display: block;
  width: 100%;
  font-size: 1.25em;
  min-height: 100px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 1px 1px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  border-radius: 0.25rem;
`

const Button = styled.button`
  color: #fff!important;
  background: #2085bc;
`

const ListItem = styled.li`
  margin: 0 0 0.5rem;
`

const InputHeader = styled.h2`
  font-weight: 600;
  font-size: 1.1em;
  margin: 0 0 1rem;
  padding: 0 0 0.5rem;
  border-bottom: 1px solid #eee;
`

const ChoiceList = styled.ul`
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
  list-style-type: none;
`

const ChoiceItem = styled.button`
  color: #2085bc;
  cursor: pointer;
  background: transparent;
  display: inline-flex;
  align-items: center;
  line-height: 1;
  font-size: 1.15em;
  border: none;
  border-bottom: 2px solid transparent;
`

const UndoButton = styled(ChoiceItem)`
  color: #8c9296;
`

const Probability = styled.span`
  color: #8c9296;
  margin-right: 0.5rem;
  font-size: 0.8em;
  min-width: 4em;
  text-align: right;
`

const Token = styled.span`
  font-weight: 600;
`

const OutputSentence = styled.div`
  margin: 20px;
  font-family: monospace;
  flex: 1;
`

const OutputToken = styled.span`
  cursor: pointer;

  :hover {
      font-weight: bold;
  }
`

const OutputSpace = styled.span``

const ModelChoice = styled.span`
  font-weight: ${props => props.selected ? 'bold' : 'normal'};
  color: ${props => props.selected ? 'black' : 'lightgray'};
  cursor: ${props => props.selected ? 'default' : 'pointer'};
`

const Footer = styled.div`
  margin: 2rem 0 0 0;
`

const DEFAULT = "너 지금까지 내 답변에 인공지능으로 ";

function addToUrl(output, choice) {
  if ('history' in window) {
    window.history.pushState(null, null, '?text=' + encodeURIComponent(output + (choice || '')))
  }
}

function loadFromUrl() {
  const params =
      document.location.search.substr(1).split('&').map(p => p.split('='));
  const text = params.find(p => p[0] === 'text');
  return Array.isArray(text) && text.length == 2 ?  decodeURIComponent(text.pop()) : null;
}

function trimRight(str) {
  return str.replace(/ +$/, '');
}

const DEFAULT_MODEL = "345M"

class App extends React.Component {

  constructor(props) {
    super(props)

    this.currentRequestId = 0;

    this.state = {
      output: loadFromUrl() || DEFAULT,
      words: null,
      logits: null,
      probabilities: null,
      loading: false,
      error: false,
      model: DEFAULT_MODEL
    }

    this.switchModel = this.switchModel.bind(this)
    this.choose = this.choose.bind(this)
    this.debouncedChoose = _.debounce(this.choose, 1000)
    this.setOutput = this.setOutput.bind(this)
    this.runOnEnter = this.runOnEnter.bind(this)
  }

  setOutput(evt) {
    const value = evt.target.value
    const trimmed = trimRight(value);

    this.setState({
        output: value,
        words: null,
        logits: null,
        probabilities: null,
        loading: trimmed.length > 0
    })
    this.debouncedChoose()
  }

  createRequestId() {
    const nextReqId = this.currentRequestId + 1;
    this.currentRequestId = nextReqId;
    return nextReqId;
  }

  componentDidMount() {
    this.choose()
    if ('history' in window) {
      window.addEventListener('popstate', () => {
        const fullText = loadFromUrl();
        const doNotChangeUrl = fullText ? true : false;
        const output = fullText || DEFAULT;
        this.setState({
          output,
          loading: true,
          words: null,
          logits: null,
          probabilities: null,
          model: this.state.model
        }, () => this.choose(undefined, doNotChangeUrl));
      })
    }
  }

  switchModel() {
    const newModel = this.state.model == "117M" ? "345M" : "117M"
    this.setState({ loading: true, error: false, model: newModel }, this.choose)
  }

  choose(choice = undefined, doNotChangeUrl) {
    this.setState({ loading: true, error: false })

    // strip trailing spaces
    const trimmedOutput = trimRight(this.state.output);
    if (trimmedOutput.length === 0) {
      this.setState({ loading: false });
      return;
    }

    const payload = {
      previous: trimmedOutput,
      next: choice,
      numsteps: 5,
      model_name: this.state.model
    }

    const currentReqId = this.createRequestId();
    const endpoint = 'http://52.231.69.211:8000/predict'

    if ('history' in window && !doNotChangeUrl) {
      addToUrl(this.state.output, choice);
    }
    gtag('config', window.googleUA, {
      page_location: document.location.toString()
    });

    fetch(endpoint, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      if (this.currentRequestId === currentReqId) {
        // If the user entered text by typing don't overwrite it, as that feels
        // weird. If they clicked it overwrite it
        const output = choice === undefined ? this.state.output : data.output
        this.setState({...data, output, loading: false})
      }
    })
    .catch(err => {
      console.error('Error trying to communicate with the API:', err);
      this.setState({ error: true, loading: false });
    });
  }

  // Temporarily (?) disabled
  runOnEnter(e) {
    if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        this.choose()
    }
  }

  render() {
    return (
      <Wrapper>
        <Title>
          <LinkHome href="https://www.leunpark.com/" target="_blank"></LinkHome>
          <AppName>김상현 Explorer</AppName>
        </Title>
        <Intro>
          이 사이트는 김상현 군과의 대화를 위한 GPT의 모델 데모 페이지입니다.
          <br></br>
          <br></br>
          최근 카카오톡 개인정보 유출 논란으로 인해 김상현 군의 대화 정보를 학습시키지 못했습니다
        </Intro>
        <InputOutput>
          <InputOutputColumn>
            <InputHeader>문장:</InputHeader>
            <TextInputWrapper>
              <TextInput type="text"
                        value={this.state.output}
                        onChange={this.setOutput}/>
              {this.state.loading ? (
                <Loading>
                  <img src="/static/loading-bars.svg" width="25" height="25" />
                  <LoadingText>Loading</LoadingText>
                </Loading>
              ) : null}
              {this.state.error ? (
                <Error>
                  ⚠️ Something went wrong. Please try again.
                </Error>
              ) : null}
            </TextInputWrapper>
          </InputOutputColumn>
          <InputOutputColumn>
            <InputHeader>옵션:</InputHeader>
            <Choices output={this.state.output}
                     choose={this.choose}
                     logits={this.state.logits}
                     words={this.state.words}
                     probabilities={this.state.probabilities}
                     hidden={this.state.loading}/>
          </InputOutputColumn>
        </InputOutput>
        <Footer>
          문의 사항은 <a href="mailto:me@leunpark.com">me@leunpark.com</a>로 주세요.
        </Footer>
      </Wrapper>
    )
  }
}

const ModelSwitcher = ({model, switchModel}) => (
  <span className="model-switcher" onClick={switchModel}>
    {' '}
    <ModelChoice selected={model==="345M"}>345M</ModelChoice>
    {' '}
    <ModelChoice selected={model==="117M"}>117M</ModelChoice>
    {' '}
  </span>
)

const formatProbability = prob => {
  prob = prob * 100
  return `${prob.toFixed(1)}%`
}

const Choices = ({output, logits, words, choose, probabilities}) => {
  if (!words) { return null }

  const lis = words.map((word, idx) => {
    const logit = logits[idx]
    const prob = formatProbability(probabilities[idx])

    // get rid of CRs
    const cleanWord = word.replace(/\n/g, "↵")

    return (
      <ListItem key={`${idx}-${cleanWord}`}>
        <ChoiceItem onClick={() => choose(word.replace("▁", " "))}>
          <Probability>{prob}</Probability>
          {' '}
          <Token>{cleanWord}</Token>
        </ChoiceItem>
      </ListItem>
    )
  })

  const goBack = () => {
    window.history.back();
  }

  const goBackItem = (
    <ListItem key="go-back">
      {'history' in window ? (
        <UndoButton onClick={goBack}>
          <Probability>←</Probability>
          {' '}
          <Token>Undo</Token>
        </UndoButton>
      ) : null}
    </ListItem>
  )

  return (
    <ChoiceList>
      {lis}
      {goBackItem}
    </ChoiceList>
  )
}



ReactDOM.render(<App />, document.getElementById("app"))