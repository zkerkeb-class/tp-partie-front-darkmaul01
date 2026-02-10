import './index.css';

const Title = ({ level = 1, label }) => {
    const Tag = `h${level}`;
    return <Tag className={`titleh${level}`}>{label}</Tag>;
};

export default Title;
