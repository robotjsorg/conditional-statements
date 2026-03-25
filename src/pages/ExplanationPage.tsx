import './ExplanationPage.css';

const ExplanationPage = () => {
  return (
    <div className="container explanation-container">
      <h2>Conditional Statements Explained</h2>
      <p className="explanation-intro">
        A conditional statement connects a condition (p) to a result (q). The standard form is:
      </p>
      <blockquote className="conditional-example">If it is raining, then the ground is wet.</blockquote>
      <p className="explanation-text">
        In this example:
      </p>
      <ul className="explanation-list">
        <li><strong>p</strong> = it is raining</li>
        <li><strong>q</strong> = the ground is wet</li>
        <li><strong>p</strong> → <strong>q</strong></li>
        <li>if it is raining → then the ground is wet</li>
      </ul>
      <p className="explanation-text">
        In logic, the contrapositive is always true when the original conditional is true:
      </p>
      <ul className="explanation-list">
        <li><strong>¬q</strong> → <strong>¬p</strong></li>
        <li>if the ground is not wet → then it is not raining</li>
      </ul>
      <h3>Derived statements</h3>
      <ul className="explanation-list">
        <li><strong>Converse</strong>: If the ground is wet, then it is raining (not always true).</li>
        <li><strong>Inverse</strong>: If it is not raining, then the ground is not wet (not always true).</li>
        <li><strong>Contrapositive</strong>: If the ground is not wet, then it is not raining (logically equivalent to the original statement).</li>
      </ul>
      <h3>Card Summary</h3>
      <div className="statement-grid explanation-card-grid">
        <div className="statement-result-card">
          <h4>Original</h4>
          <p>if it is raining → then the ground is wet</p>
        </div>
        <div className="statement-result-card">
          <h4>Converse</h4>
          <p>if the ground is wet → then it is raining</p>
        </div>
        <div className="statement-result-card">
          <h4>Inverse</h4>
          <p>if it is not raining → then the ground is not wet</p>
        </div>
        <div className="statement-result-card">
          <h4>Contrapositive</h4>
          <p>if the ground is not wet → then it is not raining</p>
        </div>
      </div>
    </div>
  );
};

export default ExplanationPage;
