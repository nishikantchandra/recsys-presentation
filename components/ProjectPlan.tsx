import React from 'react';

const ProjectPlan: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto p-8 animate-fade-in-up">
      <div className="mb-12 text-center">
        <div className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4">
           Project Plan
        </div>
        <h2 className="text-4xl font-serif font-bold text-chic-dark mb-4">Stylyst: The LLM-Powered Fashion Vibe Matcher</h2>
      </div>

      {/* Team Members */}
      <div className="mb-12">
        <h3 className="text-2xl font-serif font-bold text-chic-dark mb-6 border-b border-gray-100 pb-2">Team Members</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 text-xl">👤</div>
            <div>
              <p className="font-bold text-gray-800">Nishi Kant Chandra</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">LLM/Backend Lead</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 text-xl">👤</div>
            <div>
              <p className="font-bold text-gray-800">Ahmad Shah Rahmani</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">UI/UX Lead</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 text-xl">👤</div>
            <div>
              <p className="font-bold text-gray-800">Weichi Zhang</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Data/ML Engineer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Definition */}
      <section className="mb-12 bg-white p-8 rounded-3xl shadow-md border border-gray-100">
        <h3 className="text-2xl font-serif font-bold text-chic-dark mb-6 flex items-center">
          <span className="mr-3">📋</span> Problem Definition
        </h3>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            <strong className="text-chic-rose">RecSys gap with LLMs:</strong> Traditional fashion e-commerce relies on rigid tags. It fails at "vibe-based" or contextual queries (like "What should I wear to a casual beach wedding?"). This is a semantic understanding and reasoning problem, not simple tag-matching.
          </p>
          <p>
            <strong>User:</strong> E-commerce shoppers who are browsing for an "occasion" or "vibe" rather than a specific, known item.
          </p>
          <p>
            <strong>Business Value:</strong> Increased conversion and user trust. A user who can search in natural language ("a cool but casual outfit for a coffee date") and gets relevant, explained results is more likely to find what they want and trust the recommendation.
          </p>
        </div>
      </section>

      {/* Data & EDA */}
      <section className="mb-12 bg-white p-8 rounded-3xl shadow-md border border-gray-100">
        <h3 className="text-2xl font-serif font-bold text-chic-dark mb-6 flex items-center">
          <span className="mr-3">📊</span> Data & EDA
        </h3>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            <strong>Dataset:</strong> Kaggle Fashion Product Images Dataset (approx. 10k images with descriptions). This constitutes multimodal data.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono text-gray-600 break-all">
            Link: https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset
          </div>
          <p>
            <strong>Explore:</strong> Generate image embeddings for all 10k items using <strong>OpenCLIP</strong>. Use t-SNE or UMAP to create a 2D visualization of the embedding space.
          </p>
          <p className="italic text-gray-500 border-l-4 border-gray-300 pl-4">
            Hypothesis Check: Do "formal shoes" cluster near "formal dresses"? This validates that the embedding space understands fashion concepts.
          </p>
        </div>
      </section>

      {/* Core Feature & Workflow */}
      <section className="mb-12 bg-gradient-to-br from-pink-50 to-white p-8 rounded-3xl shadow-lg border border-pink-100">
        <h3 className="text-2xl font-serif font-bold text-chic-dark mb-6 flex items-center">
          <span className="mr-3">✨</span> Core Feature & UI/UX
        </h3>
        <p className="mb-6 text-gray-600">This follows the <strong>Three-Stage Pipeline</strong> (Retrieval, Ranking, Generation):</p>
        
        <div className="space-y-8">
          <div className="relative pl-8 border-l-2 border-chic-rose">
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-chic-rose rounded-full ring-4 ring-white"></div>
            <h4 className="font-bold text-lg text-gray-900">1. Stage 1: Retrieval</h4>
            <p className="text-gray-700 mt-2">
              User types a text query ("a '90s-style outfit for a concert."). The query is encoded using the <strong>OpenCLIP</strong> model. We perform a fast cosine similarity search (using <strong>FAISS</strong>) against the 10k pre-computed image embeddings to find the Top-20 most similar items.
            </p>
          </div>

          <div className="relative pl-8 border-l-2 border-chic-rose">
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-chic-rose rounded-full ring-4 ring-white"></div>
            <h4 className="font-bold text-lg text-gray-900">2. Stage 2: Ranking</h4>
            <p className="text-gray-700 mt-2">
              The Top-20 candidates are passed to a lightweight LLM (e.g., Mistral 7B) for <strong>re-ranking</strong> based on the prompt's nuanced understanding.
            </p>
          </div>

          <div className="relative pl-8 border-l-2 border-chic-rose">
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-chic-rose rounded-full ring-4 ring-white"></div>
            <h4 className="font-bold text-lg text-gray-900">3. Stage 3: Generation</h4>
            <p className="text-gray-700 mt-2">
              The LLM outputs the Top-3 re-ranked items and a <strong>natural language explanation</strong> (e.g., "You'll like this item because the 'flannel shirt' and 'ripped jeans' are a perfect match for the '90s concert' style...").
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-pink-200">
             <strong>UI:</strong> A simple web app with a single search bar. Results are displayed as a grid of images with the LLM-generated explanation text directly below each one.
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="mb-12 bg-white p-8 rounded-3xl shadow-md border border-gray-100">
        <h3 className="text-2xl font-serif font-bold text-chic-dark mb-6 flex items-center">
          <span className="mr-3">🚀</span> Milestones (Module-Aligned)
        </h3>
        <ul className="space-y-4 text-gray-700">
           <li className="flex items-start">
              <span className="text-chic-rose font-bold mr-2">•</span>
              <span><strong>Checkpoint 1 (Week 3):</strong> Phase 1 Complete. Data/LLM ready. All 10k images are encoded and stored in the FAISS vector index. The basic text-to-image retrieval (CLIP similarity) is functional.</span>
           </li>
           <li className="flex items-start">
              <span className="text-chic-rose font-bold mr-2">•</span>
              <span><strong>Checkpoint 2 (Week 4):</strong> Phase 2 Integrated. The Mistral 7B LLM is integrated for the re-ranking and explanation generation steps. The core UI is functional.</span>
           </li>
           <li className="flex items-start">
              <span className="text-chic-rose font-bold mr-2">•</span>
              <span><strong>Final (Week 5):</strong> Presentation submit and defense.</span>
           </li>
        </ul>
      </section>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Modeling & Deployment */}
        <section className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
            <h3 className="text-xl font-serif font-bold text-chic-dark mb-4 flex items-center">
                <span className="mr-2">🛠️</span> Modeling & Deployment
            </h3>
            <div className="space-y-4 text-gray-700">
                <p>
                    <strong>Training:</strong> We will use pre-trained models (OpenCLIP and Mistral 7B). This is a <strong>Zero-Shot or Few-Shot approach</strong>, which avoids costly fine-tuning.
                </p>
                <p>
                    <strong>Deployment:</strong> A desktop browser application. A Python (Flask/FastAPI) backend will host the models (via Hugging Face) and the FAISS index.
                </p>
            </div>
        </section>

        {/* Metrics & Trade-offs */}
        <section className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
            <h3 className="text-xl font-serif font-bold text-chic-dark mb-4 flex items-center">
                <span className="mr-2">⚖️</span> Metrics & Trade-offs
            </h3>
            <div className="space-y-4 text-gray-700">
                <p>
                    <strong>Primary:</strong> NDCG@5 (for ranking quality) and BLEU/ROUGE (to measure the quality/fluency of the generated explanations).
                </p>
                <p>
                    <strong>Priority:</strong> Accuracy & Explainability over Speed. A user is willing to wait 2-3 seconds for a high-quality, explained "vibe" match.
                </p>
                <p>
                    <strong>Trade-off:</strong> Using a local Mistral 7B is a Speed vs. Cost/Accuracy trade-off. It's slower than a large API (like GPT-4) but free, private, and powerful enough for this task.
                </p>
            </div>
        </section>
      </div>

      {/* Risks */}
      <section className="bg-yellow-50 p-8 rounded-3xl border border-yellow-100">
        <h3 className="text-2xl font-serif font-bold text-yellow-800 mb-6 flex items-center">
          <span className="mr-3">⚠️</span> Risks & Mitigation
        </h3>
        <div className="space-y-4">
           <div>
               <strong className="text-yellow-900 block mb-1">Risk:</strong>
               <p className="text-yellow-800/90">The LLM's explanations are generic ("This is a nice shirt") or hallucinated.</p>
           </div>
           <div className="pt-4 border-t border-yellow-200">
               <strong className="text-yellow-900 block mb-1">Mitigation:</strong>
               <p className="text-yellow-800/90">
                  <strong>Prompt Engineering.</strong> We will use a structured prompt with <strong>Role Injection</strong> ("You are a helpful fashion stylist..."). This will ground the LLM's response.
               </p>
           </div>
        </div>
      </section>

    </div>
  );
};

export default ProjectPlan;