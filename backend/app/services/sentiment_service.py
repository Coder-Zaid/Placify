# A fast, lightweight rule-based sentiment lexicon calculator for Vercel functions
# Checks standard positive/negative valence patterns

POSITIVE_WORDS = {
    'agree', 'benefit', 'clear', 'correct', 'efficient', 'excellent',
    'good', 'great', 'happy', 'important', 'optimal', 'perfect',
    'positive', 'recommend', 'reliable', 'success', 'successful',
    'support', 'well', 'organized', 'detail', 'concept', 'logical'
}

NEGATIVE_WORDS = {
    'bad', 'complex', 'confused', 'delay', 'difficult', 'error',
    'fail', 'failure', 'incorrect', 'issue', 'lack', 'limit',
    'limited', 'missing', 'negative', 'poor', 'slow', 'unable',
    'unstable', 'weak', 'wrong', 'problem', 'flaw', 'struggle'
}

def analyze_sentiment_valence(text: str) -> tuple:
    """
    Perform text token matching to score sentiment valence.
    Returns: (sentiment_score, tone_classification)
    """
    tokens = [w.lower().strip(",.?!:;") for w in text.split()]
    
    pos_count = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg_count = sum(1 for t in tokens if t in NEGATIVE_WORDS)
    
    total = pos_count + neg_count
    if total == 0:
        return 50, "Neutral & Objective"
        
    score = ((pos_count - neg_count) / total) * 50 + 50
    score = round(max(0, min(100, score)), 1)
    
    if score >= 70:
        tone = "Confident & Positive"
    elif score >= 45:
        tone = "Constructive & Analytical"
    else:
        tone = "Tentative & Uncertain"
        
    return score, tone
