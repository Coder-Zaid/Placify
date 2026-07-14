import math

def calculate_cosine_similarity(text1: str, text2: str) -> float:
    """
    Determine semantic similarity score between two texts.
    Calculates overlap matching vectors for vocabulary matrices.
    """
    words1 = [w.lower().strip(",.?!:;") for w in text1.split() if len(w) > 2]
    words2 = [w.lower().strip(",.?!:;") for w in text2.split() if len(w) > 2]
    
    vocab = set(words1 + words2)
    if not vocab:
        return 0.0
        
    vec1 = [words1.count(word) for word in vocab]
    vec2 = [words2.count(word) for word in vocab]
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    mag1 = math.sqrt(sum(a * a for a in vec1))
    mag2 = math.sqrt(sum(b * b for b in vec2))
    
    if mag1 == 0 or mag2 == 0:
        return 0.0
        
    return round((dot_product / (mag1 * mag2)) * 100, 1)
