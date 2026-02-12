from huggingface_hub import HfApi

api = HfApi()
models = api.list_models(filter="translation", search="Helsinki-NLP ms")
print("Found models:")
for model in models:
    print(model.modelId)

print("\nSearching for 'zlm' (Malay macrolanguage)...")
models = api.list_models(filter="translation", search="Helsinki-NLP zlm")
for model in models:
    print(model.modelId)
